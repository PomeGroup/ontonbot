import { UsersScoreActivityType } from "@/db/schema/usersScore";
import { getSBTClaimedStatus } from "@/lib/ton-society-api";
import rewardDB from "@/server/db/rewards.db";
import { RewardTonSocietyStatusType } from "@/db/schema/rewards";
import pLimit from "p-limit";
import { logger } from "@/server/utils/logger";
import { usersScoreDB } from "@/server/db/usersScore.db";
import eventDB from "@/server/db/events";
import visitorsDB from "@/server/db/visitors";

const EVENTS_BATCH_SIZE = 50;
const REWARDS_BATCH_SIZE = 30;
const MAX_CONCURRENT_API_CALLS = 10;

/**
 * This flag tells our script to stop after the current batch finishes.
 */
let shuttingDown = false;

/**
 * Keep track of all in-flight tasks so we can wait for them if a shutdown occurs.
 */
const inFlightTasks = new Set<Promise<void>>();

/**
 * Handle signals for graceful shutdown.
 */
process.on("SIGINT", () => {
  logger.log("[GracefulShutdown] Received SIGINT. Attempting to shut down gracefully...");
  initiateShutdown();
});

process.on("SIGTERM", () => {
  logger.log("[GracefulShutdown] Received SIGTERM. Attempting to shut down gracefully...");
  initiateShutdown();
});

/**
 * Mark that we should no longer start new batches, and wait for in-flight tasks to finish.
 * After some timeout, we force exit anyway to prevent indefinite hanging.
 */
function initiateShutdown() {
  shuttingDown = true;
  setTimeout(() => {
    logger.warn("[GracefulShutdown] Force exiting after timeout.");
    process.exit(1);
  }, 30_000).unref(); // 30s
}

/**
 * Wait until all currently in-flight tasks are done.
 */
async function waitForInFlightTasks() {
  if (inFlightTasks.size === 0) {
    return;
  }
  logger.log(`[GracefulShutdown] Waiting for ${inFlightTasks.size} in-flight tasks...`);
  await Promise.allSettled(inFlightTasks);
  logger.log("[GracefulShutdown] In-flight tasks completed.");
}

/**
 * Main function to sync Ton Society status in a large-scale manner,
 * with batching & concurrency limiting, optionally filtering by start_date.
 *
 * @param startDateCutoff Optional minimum start_date (epoch seconds).
 *   If > 0, only events whose start_date is greater than this are processed.
 *   Otherwise, all events with a non-null activity_id are processed.
 */
export async function syncTonSocietyStatusLargeScale(startDateCutoff: number = 0) {
  try {
    let offset = 0;
    let totalEventsProcessed = 0;

    while (!shuttingDown) {
      // 1) If a startDateCutoff is provided, fetch only events with start_date > cutoff
      //    Otherwise, fetch all events that have a non-null activity_id.
      const eventChunk =
        startDateCutoff > 0
          ? await eventDB.fetchEventsWithNonNullActivityIdAfterStartDateDESC(EVENTS_BATCH_SIZE, offset, startDateCutoff)
          : await eventDB.fetchEventsWithNonNullActivityIdDESC(EVENTS_BATCH_SIZE, offset);

      if (eventChunk.length === 0) {
        logger.log("No more events with activity_id to process.");
        break;
      }

      for (const eventRow of eventChunk) {
        if (shuttingDown) break;

        const { event_id, event_uuid, activity_id } = eventRow;
        logger.log(`\n[Event ${event_id}] Starting sync for activity_id=${activity_id}`);

        if (!activity_id) continue;

        let rewardOffset = 0;
        while (!shuttingDown) {
          const rewardChunk = await rewardDB.fetchNotClaimedRewardsForEvent(event_uuid, REWARDS_BATCH_SIZE, rewardOffset);

          if (rewardChunk.length === 0) {
            logger.log(`[Event ${event_id}] No more rewards to process.`);
            break;
          }

          // Concurrency limiting
          const limit = pLimit(MAX_CONCURRENT_API_CALLS);

          const updatePromises = rewardChunk.map(({ reward_id, visitor_id }) =>
            limit(async () => {
              let task: Promise<void> | undefined;
              try {
                task = handleSingleRewardUpdate(activity_id, visitor_id, event_id);
                inFlightTasks.add(task);
                await task;
              } finally {
                if (task) {
                  inFlightTasks.delete(task);
                }
              }
            })
          );

          await Promise.all(updatePromises);

          logger.log(`[Event ${event_id}] Processed ${rewardChunk.length} rewards [offset: ${rewardOffset}]`);
          rewardOffset += REWARDS_BATCH_SIZE;
        }

        logger.log(`[Event ${event_id}] Done syncing rewards for activity_id=${activity_id}`);
      }

      offset += EVENTS_BATCH_SIZE;
      totalEventsProcessed += eventChunk.length;
      logger.log(`\nProcessed ${eventChunk.length} events. Total so far: ${totalEventsProcessed}.`);
    }

    logger.log("Event loop complete or shutting down requested. Waiting on in-flight tasks...");
    await waitForInFlightTasks();
    logger.log("All events processed or stopped. Sync complete.");
  } catch (error) {
    logger.error("Error in syncTonSocietyStatusLargeScale:", error);
    throw error;
  }
}

/**
 * Updates Ton Society status for a single reward record:
 * 1) Get the visitor row to find user_id
 * 2) Call getSBTClaimedStatus(activityId, userId)
 * 3) If status is "CLAIMED" or "RECEIVED", update `tonSocietyStatus`
 *    AND insert user score if not already inserted.
 */
async function handleSingleRewardUpdate(activity_id: number, visitor_id: number, event_id: number) {
  // 1) Get the visitor to find user_id
  const visitorRow = await visitorsDB.findVisitorById(visitor_id);
  if (!visitorRow) return;

  const userId = visitorRow.user_id;
  if (!userId) return;

  // 2) Get the status from Ton Society
  const result = await getSBTClaimedStatus(activity_id, userId);
  logger.log(
    `[Visitor ${visitor_id}] and [Activity ${activity_id}] and [User ${userId}] Ton Society status: ${result.status}`
  );
  const tsStatus = result?.status; // e.g. "NOT_CLAIMED" | "CLAIMED" | "RECEIVED" | ...

  // 3) If it’s one of our known statuses, update local DB
  if (tsStatus && ["NOT_CLAIMED", "CLAIMED", "RECEIVED"].includes(tsStatus)) {
    const tonSocietyStatus = tsStatus as RewardTonSocietyStatusType;
    await rewardDB.updateTonSocietyStatusByVisitorId(visitor_id, tonSocietyStatus);

    // 4) If newly claimed, add user score — "CLAIMED" or "RECEIVED" implies the user actually claimed it
    if (tonSocietyStatus === "CLAIMED" || tonSocietyStatus === "RECEIVED") {
      await maybeInsertUserScore(userId, event_id); // <-- NEW
    }
  }
}

/**
 * Inserts a new user score record if none exists yet for this user+event.
 *
 * We derive the "activityType" from:
 * - event.has_payment -> "paid" vs "free"
 * - event.participationType -> "online" vs "in_person"
 *
 * Then we pick the correct point value:
 *   "free_online_event" : 10 points
 *   "free_offline_event": 15 points
 *   "paid_online_event": 20 points
 *   "paid_offline_event": 25 points
 */
async function maybeInsertUserScore(userId: number, eventId: number) {
  // 1) Fetch the event to see if it's free or paid, and online or offline
  const eventRow = await eventDB.fetchEventById(eventId);

  if (!eventRow) {
    logger.warn(`Event not found for eventId=${eventId}. Skipping user score insert.`);
    return;
  }

  // 2) Determine the correct activityType & points
  // has_payment => "paid_" or "free_"
  // participationType => "online" or "in_person"
  // e.g. "free_online_event"
  let chosenActivityType: UsersScoreActivityType = "free_online_event";
  let points = 10;

  const isPaid = !!eventRow.has_payment;
  const isOnline = eventRow.participationType === "online";

  if (isPaid && isOnline) {
    chosenActivityType = "paid_online_event";
    points = 20;
  } else if (isPaid && !isOnline) {
    // participationType could be "in_person" or some variation
    chosenActivityType = "paid_offline_event";
    points = 25;
  } else if (!isPaid && isOnline) {
    chosenActivityType = "free_online_event";
    points = 10;
  } else {
    chosenActivityType = "free_offline_event";
    points = 15;
  }

  // 3) Insert user score if not exists
  // Rely on your unique index or check manually
  try {
    await usersScoreDB.createUserScore({
      userId,
      activityType: chosenActivityType,
      point: points,
      active: true,
      itemId: eventId, // item_id = event's ID
      itemType: "event", // item_type = "event"
    });
    logger.log(`[UserScore] Inserted ${chosenActivityType} for user=${userId}, event=${eventId}, points=${points}`);
  } catch (err: any) {
    // If it's a unique violation, ignore—score already exists
    const message = String(err.message || err);
    if (message.includes("duplicate key value") || message.includes("unique constraint")) {
      logger.log(`[UserScore] Score record already exists for user=${userId}, event=${eventId}. Skipped duplicate.`);
    } else {
      throw err; // Some other error
    }
  }
}

// CLI entry point: read optional startDateCutoff from command line
if (require.main === module) {
  // Example usage: `ts-node script.ts 1680000000`
  // 1680000000 => approximate epoch for March 29, 2023
  const arg = process.argv[2]; // optional
  const startDateCutoff = arg ? parseInt(arg, 10) : 0;
  logger.log(`Starting large-scale SBT REWARD CHECK sync with startDateCutoff=${startDateCutoff}...`);
  syncTonSocietyStatusLargeScale(startDateCutoff)
    .then(() => {
      logger.log("Large-scale sync complete. Exiting.");
      process.exit(0);
    })
    .catch(async (error) => {
      logger.error("Fatal error:", error);
      await waitForInFlightTasks();
      process.exit(1);
    });
}
