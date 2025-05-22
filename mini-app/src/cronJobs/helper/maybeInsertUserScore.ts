import eventDB from "@/db/modules/events";
import { UsersScoreActivityType } from "@/db/schema/usersScore";
import { usersScoreDB } from "@/db/modules/usersScore.db";
import { logger } from "@/server/utils/logger";

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
export const maybeInsertUserScore = async (userId: number, eventId: number) => {
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
  let organizerPoints = 0.2;

  const isPaid = !!eventRow.has_payment;
  const isOnline = eventRow.participationType === "online";

  if (isPaid && isOnline) {
    chosenActivityType = "paid_online_event";
    points = 10;
  } else if (isPaid && !isOnline) {
    // participationType could be "in_person" or some variation
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
    //insert points for organizer
    await usersScoreDB.upsertOrganizerScore({
      userId: eventRow.owner,
      activityType: chosenActivityType,
      point: organizerPoints,
      active: true,
      itemId: eventId, // item_id = event's ID
      itemType: "organize_event", // item_type = "organize_event"
    });
    logger.log(`[UserScore] Inserted ${chosenActivityType} for user=${userId}, event=${eventId}, points=${points}`);
  } catch (err) {
    // If it's a unique violation, ignore—score already exists
    const message = String(err);
    if (message.includes("duplicate key value") || message.includes("unique constraint")) {
      logger.log(`[UserScore] Score record already exists for user=${userId}, event=${eventId}. Skipped duplicate.`);
    } else {
      throw err; // Some other error
    }
  }
};
