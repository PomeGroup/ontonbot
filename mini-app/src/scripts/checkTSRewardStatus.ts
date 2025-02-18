import { db } from "@/db/db";
import { events } from "@/db/schema/events";
import { rewards } from "@/db/schema/rewards";
import { and, eq, isNotNull, not, sql } from "drizzle-orm";
import { getSBTClaimedStatus } from "@/lib/ton-society-api";
import rewardDB from "@/server/db/rewards.db";
import { RewardTonSocietyStatusType } from "@/db/schema/rewards";
import pLimit from "p-limit";
import { logger } from "@/server/utils/logger";

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
 * with batching & concurrency limiting.
 */
export async function syncTonSocietyStatusLargeScale() {
  try {
    let offset = 0;
    let totalEventsProcessed = 0;

    while (!shuttingDown) {
      // 1) Fetch a chunk of events with non-null activity_id
      const eventChunk = await db
        .select()
        .from(events)
        .where(isNotNull(events.activity_id))
        .orderBy(sql`${events.event_id} DESC`)
        .limit(EVENTS_BATCH_SIZE)
        .offset(offset)
        .execute();

      if (eventChunk.length === 0) {
        logger.log("No more events with activity_id to process.");
        break;
      }

      for (const eventRow of eventChunk) {
        if (shuttingDown) break; // Stop if we’re shutting down

        const { event_id, event_uuid, activity_id } = eventRow;
        logger.log(`\n[Event ${event_id}] Starting sync for activity_id=${activity_id}`);

        if (!activity_id) continue;

        let rewardOffset = 0;
        while (!shuttingDown) {
          // 2) Fetch a chunk of rewards for this event
          const rewardChunk = await db
            .select({
              reward_id: rewards.id,
              visitor_id: rewards.visitor_id,
            })
            .from(rewards)
            .innerJoin(sql`visitors as v`, eq(sql`v.id`, rewards.visitor_id))
            .where(and(eq(sql`v.event_uuid`, event_uuid), eq(rewards.tonSocietyStatus, "NOT_CLAIMED")))
            .orderBy(sql`${rewards.id} ASC`)
            .limit(REWARDS_BATCH_SIZE)
            .offset(rewardOffset)
            .execute();

          if (rewardChunk.length === 0) {
            // No more rewards for this event
            logger.log(`[Event ${event_id}] No more rewards to process.`);
            break;
          }

          // Concurrency limiting
          const limit = pLimit(MAX_CONCURRENT_API_CALLS);

          // 3) Prepare an array of promises
          const updatePromises = rewardChunk.map(({ reward_id, visitor_id }) =>
            limit(async () => {
              // Declare `task` outside the try block
              let task: Promise<void> | undefined;

              try {
                // Assign the promise
                task = handleSingleRewardUpdate(activity_id, visitor_id);
                inFlightTasks.add(task);
                await task;
              } finally {
                // Remove from the set once it finishes
                if (task) {
                  inFlightTasks.delete(task);
                }
              }
            })
          );

          // 4) Run all in parallel up to concurrency limit
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
 * 3) Update tonSocietyStatus if in the expected set
 */
async function handleSingleRewardUpdate(activity_id: number, visitor_id: number) {
  // 1) get the visitor to find user_id
  const visitorRow = await db.query.visitors.findFirst({
    where: (fields, { eq }) => eq(fields.id, visitor_id),
  });
  if (!visitorRow) return;

  const userId = visitorRow.user_id;
  if (!userId) return;

  // 2) get the status from Ton Society
  const result = await getSBTClaimedStatus(activity_id, userId);
  logger.log(`[Visitor ${visitor_id}] and [Activity ${activity_id}] status: ${result.status}`);
  const tsStatus = result?.status; // e.g. "NOT_CLAIMED" | "CLAIMED" | "RECEIVED" | ...

  // 3) If it’s one of our known statuses, update local DB
  if (tsStatus && ["NOT_CLAIMED", "CLAIMED", "RECEIVED"].includes(tsStatus)) {
    const tonSocietyStatus = tsStatus as RewardTonSocietyStatusType;
    await rewardDB.updateTonSocietyStatusByVisitorId(visitor_id, tonSocietyStatus);
  }
}

// If this script is run directly (via ts-node), start the main function
if (require.main === module) {
  syncTonSocietyStatusLargeScale()
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
