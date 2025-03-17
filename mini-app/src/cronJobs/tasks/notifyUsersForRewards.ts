import { RewardType } from "@/types/event.types";
import { db } from "@/db/db";
import { sleep } from "@/utils";
import { findVisitorById } from "@/server/db/visitors";
import eventDB from "@/server/db/events";
import telegramService from "@/server/routers/services/telegramService";
import rewardDB from "@/server/db/rewards.db";
import { logger } from "@/server/utils/logger";
import { getErrorMessages } from "@/lib/error";

async function sendRewardNotification(createdReward: RewardType) {
  try {
    const visitor = await findVisitorById(createdReward.visitor_id);
    if (!visitor) {
      logger.error(`Visitor not found for reward ${createdReward.id}`);
      throw new Error("Visitor not found");
    }

    const event = await eventDB.fetchEventByUuid(visitor.event_uuid);
    const rewardDbData = await rewardDB.checkExistingReward(visitor.id);
    if (!event) throw new Error("Event not found");

    if (!rewardDbData) throw new Error("Reward data not found");

    await telegramService.sendRewardNotification(createdReward, visitor, event, rewardDbData);
    await rewardDB.updateRewardStatus(createdReward.id, "notified");
  } catch (error) {
    logger.error("Error sending reward notification:", error);
    logger.error("BOT_API_ERROR", getErrorMessages(error));
    await rewardDB.handleRewardError(createdReward, error);
  }
}

export const notifyUsersForRewards = async (pushLockTTl: () => any) => {
  const chunkSize = 10;
  let offset = 0;
  let createdRewards: RewardType[] = [];

  do {
    createdRewards = await db.query.rewards.findMany({
      where: (fields, { eq }) => eq(fields.status, "created"),
      limit: chunkSize,
      offset,
    });

    offset += createdRewards.length;

    const notificationPromises = createdRewards.map((createdReward) => async () => {
      await sendRewardNotification(createdReward);
    });

    for (const notification of notificationPromises) {
      await notification();
    }
    if (pushLockTTl) await pushLockTTl();
    await sleep(1500);
  } while (createdRewards.length > 0);

  return offset;
};
