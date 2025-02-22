import { findVisitorById } from "@/server/db/visitors";
import eventDB from "@/server/db/events";
import { createUserRewardLink, updateActivity } from "@/lib/ton-society-api";
import { sleep } from "@/utils";
import rewardDB from "@/server/db/rewards.db";
import { logger } from "@/server/utils/logger";
import type { RewardType } from "@/types/event.types";
import { AxiosError } from "axios";

const maxAttempts = 3; // Retries for non-429 errors
let rewardRequestCount = 0;

/**
 * Handles a single reward creation with retry logic.
 */
async function processSingleReward(pendingReward: RewardType): Promise<void> {
  let attempts = 0;

  while (true) {
    // brief delay to avoid overwhelming the API
    await sleep(20);

    try {
      const visitor = await findVisitorById(pendingReward.visitor_id);
      const event = await eventDB.selectEventByUuid(visitor?.event_uuid as string);

      rewardRequestCount++;
      logger.log("rewardRequestCount", rewardRequestCount, " reward id: ", pendingReward.id, "time:", new Date());

      const response = await createUserRewardLink(event?.activity_id as number, {
        telegram_user_id: visitor?.user_id as number,
        attributes: [{ trait_type: "Organizer", value: event?.society_hub.name as string }],
      });

      await rewardDB.updateReward(pendingReward.id, response.data.data);
      return; // success, exit the loop
    } catch (error) {
      // Handle HTTP 429 (rate limit)
      if (error instanceof AxiosError && error.response?.status === 429) {
        logger.warn(`Hit 429 rate limit for reward ${pendingReward.id}, waiting 30s before retry...`);
        await sleep(30000); // wait 30s, then retry indefinitely on 429
      } else {
        // Other errors: retry up to maxAttempts
        attempts++;
        if (attempts < maxAttempts) {
          logger.warn(`Error (attempt #${attempts}) processing reward ${pendingReward.id}, retrying...`);
          await sleep(1000);
        } else {
          // After final attempt, mark as failed
          logger.error(`Failed to process reward ${pendingReward.id} after ${maxAttempts} attempts`, error);
          await rewardDB.handleRewardError(pendingReward, error);
          return; // give up on this reward
        }
      }
    }
  }
}

/**
 * Processes rewards in parallel chunks (size=15 here),
 * with retry/backoff for rate limits (429) and other errors.
 */
export const processRewardChunkParallel = async (pendingRewards: RewardType[]) => {
  const chunkSize = 15;

  for (let i = 0; i < pendingRewards.length; i += chunkSize) {
    const chunk = pendingRewards.slice(i, i + chunkSize);

    // For each reward in the chunk, create a Promise that handles its own retry logic
    const promises = chunk.map((pendingReward) => processSingleReward(pendingReward));

    // Wait for all promises in this chunk to settle
    await Promise.allSettled(promises);

    // Small pause between chunks
    await sleep(1000);
  }
};

/**
 * Create Rewards in order of event-end-date (descending) but in chunked batches per event.
 * If an event has already ended, extend the event's end_date by 1 hour on Ton Society before
 * creating rewards, then revert it back to the original date when done.
 */
export const createRewards = async (pushLockTTl: () => any) => {
  // 1) Gather all events that have pending rewards, sorted by event_end_date DESC
  const eventsWithPending = await eventDB.fetchEventsWithPendingRewards();

  const resultPerPage = 300;
  let totalProcessed = 0;

  // 2) For each event (descending by end_date), process rewards in chunks
  for (const evt of eventsWithPending) {
    // Retrieve the local event record to get activity_id, current end_date, etc.
    const localEvent = await eventDB.selectEventByUuid(evt.eventUuid);

    // If we can't find a local event or no valid activity_id, skip
    if (!localEvent || !localEvent.activity_id) {
      logger.warn(`Event ${evt.eventUuid} missing local record or activity_id, skipping reward creation...`);
      continue;
    }

    // Convert the event's "end_date" (assumed to be a UNIX timestamp in seconds) to a Date
    const eventEndTimestamp = localEvent.end_date;
    const now = Math.floor(Date.now() / 1000); // current UNIX time in seconds

    // We will only extend the end_date if it's already in the past
    let didExtend = false;
    const originalEndDate = eventEndTimestamp;
    const extendedEndDate = originalEndDate + 3600; // +1 hour in seconds

    // Check if the event has ended
    if (originalEndDate < now + 600) {
      // 2a) Update the event's end_date on Ton Society
      try {
        logger.log(
          `Extending end_date for activity_id=${localEvent.activity_id} from ${originalEndDate} to ${extendedEndDate}`
        );

        // Make sure "updateActivity" expects end_date as an integer (seconds).
        await updateActivity({ end_date: String(extendedEndDate) }, localEvent.activity_id);
        didExtend = true;
      } catch (err) {
        logger.error(`Failed to extend end_date on Ton Society for event ${evt.eventUuid}`);
        // If we can't extend the date, skip creating rewards
        continue;
      }
    }

    try {
      let offset = 0;
      let pendingRewards: RewardType[] = [];

      do {
        // 3) Fetch up to "resultPerPage" pending rewards for this specific event
        pendingRewards = await rewardDB.fetchPendingRewardsForEvent(evt.eventUuid, resultPerPage, offset);

        if (pendingRewards.length === 0) {
          break;
        }

        offset += pendingRewards.length;

        // 4) Process the chunk in parallel
        await processRewardChunkParallel(pendingRewards);

        if (pushLockTTl) {
          await pushLockTTl(); // extend lock or TTL if needed
        }

        totalProcessed += pendingRewards.length;
      } while (pendingRewards.length === resultPerPage);
    } finally {
      // 2b) Revert the end_date on Ton Society only if we extended it
      if (didExtend) {
        try {
          logger.log(`Reverting end_date for activity_id=${localEvent.activity_id} back to ${originalEndDate}`);
          await updateActivity({ end_date: String(originalEndDate) }, localEvent.activity_id);
        } catch (err) {
          logger.error(`Failed to revert end_date on Ton Society for event ${evt.eventUuid}`);
        }
      }
    }
  }

  return totalProcessed;
};
