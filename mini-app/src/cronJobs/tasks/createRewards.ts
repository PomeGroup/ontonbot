import { db } from "@/db/db";
import { eq, desc, asc } from "drizzle-orm";
import { events } from "@/db/schema/events";
import { visitors } from "@/db/schema/visitors";
import { rewards } from "@/db/schema/rewards";

import { findVisitorById } from "@/server/db/visitors";
import eventDB from "@/server/db/events";
import { createUserRewardLink } from "@/lib/ton-society-api";
import { sleep } from "@/utils";
import rewardDB from "@/server/db/rewards.db";
import { logger } from "@/server/utils/logger";

import type { RewardType } from "@/types/event.types";
import { AxiosError } from "axios";

const maxAttempts = 2; // Retries for non-429 errors
let rewardRequestCount = 0;

/**
 * Handles a single reward creation with retry logic.
 */
async function processSingleReward(pendingReward: RewardType): Promise<void> {
  let attempts = 0;

  while (true) {
    await sleep(20); // do not overwhelm API
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
        logger.warn(`Hit 429 rate limit for reward ${pendingReward.id}, waiting 1s before retry...`);
        await sleep(30000);
        // Then loop again (indefinite retry for 429)
      } else {
        // Other errors: retry up to maxAttempts
        attempts++;
        if (attempts < maxAttempts) {
          logger.warn(`Error (attempt #${attempts}) processing reward ${pendingReward.id}, retrying...`);
          await sleep(1000);
        } else if (error instanceof AxiosError) {
          logger.error(`Failed to process reward ${pendingReward.id} after ${maxAttempts} attempts`, error?.status);
          await rewardDB.handleRewardError(pendingReward, error);
          return; // give up on this reward
        } else {
          logger.error(`NOT_AXIOS_ERROR Failed to process reward ${pendingReward.id} after ${maxAttempts} attempts`);
          await rewardDB.handleRewardError(pendingReward, error);
          return; // give up on this reward
        }
      }
    }
  }
}

/**
 * Processes rewards in parallel chunks of 50.
 */
export const processRewardChunkParallel = async (pendingRewards: RewardType[]) => {
  const chunkSize = 15;

  for (let i = 0; i < pendingRewards.length; i += chunkSize) {
    const chunk = pendingRewards.slice(i, i + chunkSize);

    // For each reward in the chunk, kick off a Promise that does retries/backoff on 429
    const promises = chunk.map((pendingReward) => processSingleReward(pendingReward));

    // Wait for all promises in this chunk to settle
    await Promise.allSettled(promises);
    await sleep(1000);
  }
};

/**
 * Create Rewards in order of event-end-date (descending) but in chunked batches per event.
 * @param pushLockTTl - a function to keep your lock/timer alive each iteration.
 */
export const createRewards = async (pushLockTTl: () => any) => {
  // 1) Gather all events (via visitors) that have pending rewards, sorted by event_end_date DESC.
  //    We rely on the "events" table's end_date to determine event recency.

  const eventsWithPending = await db
    .select({
      eventUuid: events.event_uuid,
      eventEndDate: events.end_date,
    })
    .from(rewards)
    .innerJoin(visitors, eq(visitors.id, rewards.visitor_id))
    .innerJoin(events, eq(visitors.event_uuid, events.event_uuid))
    .where(eq(rewards.status, "pending_creation"))
    .groupBy(events.event_uuid, events.end_date)
    .orderBy(desc(events.end_date)); // from last finished event to earliest
  const resultPerPage = 300;
  let totalProcessed = 0;

  // 2) For each event (descending by end_date), process rewards in chunks
  for (const evt of eventsWithPending) {
    let offset = 0;
    let pendingRewards: RewardType[] = [];

    do {
      // 3) Fetch up to 250 pending rewards for this specific event
      pendingRewards = await db.query.rewards.findMany({
        where: (fields, { eq, and, inArray }) =>
          and(
            eq(fields.status, "pending_creation"),
            inArray(
              fields.visitor_id,
              db.select({ id: visitors.id }).from(visitors).where(eq(visitors.event_uuid, evt.eventUuid))
            )
          ),
        limit: resultPerPage,
        offset,
        // you can adjust the sort columns, but typically you'd keep it by creation date
        orderBy: [asc(rewards.created_at)],
      });

      // if no more rewards for this event, break
      if (pendingRewards.length === 0) {
        break;
      }

      offset += pendingRewards.length;

      // 4) Process the chunk
      await processRewardChunkParallel(pendingRewards);

      if (pushLockTTl !== undefined) await pushLockTTl(); // extend lock or TTL if needed

      totalProcessed += pendingRewards.length;
    } while (pendingRewards.length === resultPerPage);
  }

  return totalProcessed;
};
