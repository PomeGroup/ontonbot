import visitorsDB from "@/server/db/visitors";
import { getSBTClaimedStatus } from "@/lib/ton-society-api";
import { RewardTonSocietyStatusType } from "@/db/schema/rewards";
import { logger } from "@sentry/core";
import rewardDB from "@/server/db/rewards.db";
import { maybeInsertUserScore } from "@/cronJobs/helper/maybeInsertUserScore";

/**
 * Updates Ton Society status for a single reward record:
 * 1) Get the visitor row to find user_id
 * 2) Call getSBTClaimedStatus(activityId, userId)
 * 3) If status is "CLAIMED" or "RECEIVED", update `tonSocietyStatus`
 *    AND insert user score if not already inserted.
 */
export const handleSingleRewardUpdate = async (activity_id: number, visitor_id: number, event_id: number) => {
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
};
