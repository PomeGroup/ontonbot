import eventDB from "@/db/modules/events";
import { UsersScoreActivityType } from "@/db/schema/usersScore";
import { usersScoreDB } from "@/db/modules/usersScore.db";
import { logger } from "@/server/utils/logger";

export type MaybeInsertUserScoreResult =
  | {
      user_point: number;
      organizer_point: number;
      error: null;
    }
  | {
      user_point: null;
      organizer_point: null;
      error: string;
    };
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
export async function maybeInsertUserScore(userId: number, eventId: number): Promise<MaybeInsertUserScoreResult> {
  try {
    // 1) Fetch the event
    const eventRow = await eventDB.fetchEventById(eventId);
    if (!eventRow) {
      logger.warn(`Event not found for eventId=${eventId}. Skipping user score insert.`);
      return {
        user_point: null,
        organizer_point: null,
        error: "Event not found",
      };
    }

    // 2) Determine activity type & points
    let chosenActivityType: UsersScoreActivityType = "free_online_event";
    let points = 10;
    let organizerPoints = 0.2;

    const isPaid = !!eventRow.has_payment;
    const isOnline = eventRow.participationType === "online";

    if (isPaid && isOnline) {
      chosenActivityType = "paid_online_event";
      points = 10;
    } else if (isPaid && !isOnline) {
      chosenActivityType = "paid_offline_event";
      points = 20;
    } else if (!isPaid && isOnline) {
      chosenActivityType = "free_online_event";
      points = 1;
    } else {
      chosenActivityType = "free_offline_event";
      points = 10;
    }
    organizerPoints = points * 0.2;

    // 3) Insert participant's score
    try {
      await usersScoreDB.createUserScore({
        userId,
        activityType: chosenActivityType,
        point: points,
        active: true,
        itemId: eventId,
        itemType: "event",
      });
      logger.log(`[UserScore] Inserted ${chosenActivityType} for user=${userId}, event=${eventId}, points=${points}`);
    } catch (err) {
      const message = String(err);
      if (message.includes("duplicate key value") || message.includes("unique constraint")) {
        logger.log(`[UserScore] Score record already exists for user=${userId}, event=${eventId}. Skipped duplicate.`);
      } else {
        // Return an error
        logger.error(`[UserScore] Failed creating participant score for user=${userId}, event=${eventId}: ${message}`);
        return {
          user_point: null,
          organizer_point: null,
          error: `Failed creating participant score`,
        };
      }
    }

    // 4) Insert or update organizer score
    try {
      await usersScoreDB.upsertOrganizerScore({
        userId: eventRow.owner,
        activityType: chosenActivityType,
        point: organizerPoints,
        active: true,
        itemId: eventId,
        itemType: "organize_event",
      });
      logger.log(
        `[UserScore] Inserted or updated organizer score for owner=${eventRow.owner}, event=${eventId}, points=${organizerPoints}`
      );
    } catch (err) {
      const message = String(err);
      // Return an error
      return {
        user_point: null,
        organizer_point: null,
        error: `Failed creating organizer score: ${message}`,
      };
    }

    // 5) Return success
    return {
      user_point: points,
      organizer_point: organizerPoints,
      error: null,
    };
  } catch (error) {
    // Catch any unforeseen error
    const message = String(error);
    logger.error(`[maybeInsertUserScore] Unexpected error: ${message}`);
    return {
      user_point: null,
      organizer_point: null,
      error: message,
    };
  }
}
