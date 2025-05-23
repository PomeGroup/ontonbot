import visitorsDB from "@/db/modules/visitors";
import { getSBTClaimedStatus } from "@/lib/ton-society-api";
import { RewardTonSocietyStatusType } from "@/db/schema/rewards";
import { logger } from "@/server/utils/logger";
import rewardDB from "@/db/modules/rewards.db";
import { maybeInsertUserScore } from "@/cronJobs/helper/maybeInsertUserScore";
import { informTonfestUserClaim } from "@/cronJobs/helper/informTonfestUserClaim";
import { RewardType } from "@/db/enum";

export type HandleSingleRewardUpdateResult = {
  success: boolean; // was the update successful?
  error: string | null; // any error message
  tonSocietyStatus: RewardTonSocietyStatusType | null; // final status we ended up with, e.g. "CLAIMED"
  userScore?: {
    user_point: number | null;
    organizer_point: number | null;
    error: string | null;
  };
  visitorId?: number | null; // the visitor ID we processed
};

export const handleSingleRewardUpdate = async (
  activity_id: number,
  visitor_id: number,
  event_id: number,
  rewardType: RewardType
): Promise<HandleSingleRewardUpdateResult> => {
  // 1) Validate input
  if (!activity_id || !visitor_id || !event_id || !rewardType) {
    const errorMsg = `[Event ${event_id}] Invalid input: activity_id=${activity_id}, visitor_id=${visitor_id}, event_id=${event_id}, rewardType=${rewardType}`;
    logger.error(errorMsg);
    return {
      success: false,
      error: errorMsg,
      tonSocietyStatus: null,
      visitorId: null,
    };
  }

  // 2) Get the visitor
  const visitorRow = await visitorsDB.findVisitorById(visitor_id);
  if (!visitorRow) {
    const errorMsg = `[Event ${event_id}] Visitor not found for id=${visitor_id}`;
    logger.error(errorMsg);
    return {
      success: false,
      error: errorMsg,
      tonSocietyStatus: null,
    };
  }

  const userId = visitorRow.user_id;
  if (!userId) {
    const errorMsg = `[Event ${event_id}] Visitor row has no user_id for visitor_id=${visitor_id}`;
    logger.error(errorMsg);
    return {
      success: false,
      error: errorMsg,
      tonSocietyStatus: null,
    };
  }

  // 3) Fetch Ton Society's SBT claim status
  const result = await getSBTClaimedStatus(activity_id, userId);
  const tsStatus = result?.status as RewardTonSocietyStatusType | undefined;
  // possible "NOT_CLAIMED", "CLAIMED", "RECEIVED", etc.

  // 4) If tsStatus is recognized, update local DB
  if (tsStatus && ["NOT_CLAIMED", "CLAIMED", "RECEIVED"].includes(tsStatus)) {
    // update the reward row
    logger.log(
      `[Event ${event_id}] Updating Ton Society status for visitor_id=${visitor_id}, user_id=${userId} => ${rewardType} with status=${tsStatus}`
    );

    await rewardDB.updateTonSocietyStatusByVisitorIdAndRewardType(visitor_id, tsStatus, rewardType);

    // 4a) If it's "CLAIMED" or "RECEIVED", possibly insert user score
    if (tsStatus === "CLAIMED" || tsStatus === "RECEIVED") {
      if (rewardType === "ton_society_sbt") {
        // maybeInsertUserScore returns e.g. { user_point, organizer_point, error }
        const userScoreResult = await maybeInsertUserScore(userId, event_id);

        // Return success with userScore data
        return {
          success: true,
          error: null,
          tonSocietyStatus: tsStatus,
          userScore: userScoreResult,
          visitorId: visitor_id,
        };
      }

      if (rewardType === "ton_society_csbt_ticket") {
        // call your method
        await informTonfestUserClaim(userId, event_id, tsStatus === "CLAIMED" ? "addSbtFromOnton" : "setSbtPending");

        return {
          success: true,
          error: null,
          tonSocietyStatus: tsStatus,
          visitorId: visitor_id,
        };
      }
    }

    // 4b) If status is "NOT_CLAIMED" we still updated the DB, but no user score.
    return {
      success: true,
      error: null,
      tonSocietyStatus: tsStatus,
      visitorId: visitor_id,
    };
  }

  // 5) If we got here, either tsStatus is undefined or not recognized
  const errorMsg = `[Event ${event_id}] Could not update Ton Society status; unrecognized or missing status: ${tsStatus}`;
  logger.warn(errorMsg);
  return {
    success: false,
    error: errorMsg,
    tonSocietyStatus: tsStatus || null,
  };
};
