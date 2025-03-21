import visitorsDB from "@/server/db/visitors";
import { getSBTClaimedStatus } from "@/lib/ton-society-api";
import { RewardTonSocietyStatusType } from "@/db/schema/rewards";
import { logger } from "@/server/utils/logger";
import rewardDB from "@/server/db/rewards.db";
import { maybeInsertUserScore } from "@/cronJobs/helper/maybeInsertUserScore";
import { informTonfestUserClaim } from "@/cronJobs/helper/informTonfestUserClaim";
import { RewardType } from "@/db/enum";

/**
 * Updates Ton Society status for a single reward record:
 * 1) Get the visitor row to find user_id
 * 2) Call getSBTClaimedStatus(activityId, userId)
 * 3) If status is "CLAIMED" or "RECEIVED", update `tonSocietyStatus`
 *    AND insert user score if not already inserted.
 */
export const handleSingleRewardUpdate = async (
  activity_id: number,
  visitor_id: number,
  event_id: number,
  rewardType: RewardType
) => {
  // 1) Get the visitor to find user_id
  if (!activity_id || !visitor_id || !event_id || !rewardType) {
    logger.error(
      `[Event ${event_id}] Invalid input: activity_id=${activity_id}, visitor_id=${visitor_id}, event_id=${event_id}, rewardType=${rewardType}`
    );
    return;
  }
  const visitorRow = await visitorsDB.findVisitorById(visitor_id);
  if (!visitorRow) return;

  const userId = visitorRow.user_id;
  if (!userId) return;

  // 2) Get the status from Ton Society
  const result = await getSBTClaimedStatus(activity_id, userId);

  const tsStatus = result?.status; // e.g. "NOT_CLAIMED" | "CLAIMED" | "RECEIVED" | ...

  // 3) If it’s one of our known statuses, update local DB
  if (tsStatus && ["NOT_CLAIMED", "CLAIMED", "RECEIVED"].includes(tsStatus)) {
    const tonSocietyStatus = tsStatus as RewardTonSocietyStatusType;
    logger.log(
      `[Event ${event_id}] Updating Ton Society status for visitor_id=${visitor_id}  user_id=${userId} to ${rewardType} ${tonSocietyStatus}`
    );
    await rewardDB.updateTonSocietyStatusByVisitorIdAndRewardType(visitor_id, tonSocietyStatus, rewardType);

    // 4) If newly claimed, add user score — "CLAIMED" or "RECEIVED" implies the user actually claimed it
    if (tonSocietyStatus === "CLAIMED" || tonSocietyStatus === "RECEIVED") {
      if (rewardType === "ton_society_sbt") {
        await maybeInsertUserScore(userId, event_id);
      }
      if (rewardType === "ton_society_csbt_ticket") {
        await informTonfestUserClaim(userId, event_id, tonSocietyStatus === "CLAIMED" ? "addSbtFromOnton" : "setSbtPending");
      }
    }
  }
  return;
};
