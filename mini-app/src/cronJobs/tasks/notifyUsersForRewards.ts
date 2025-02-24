import { RewardType } from "@/types/event.types";
import { db } from "@/db/db";
import { sleep } from "@/utils";
import { findVisitorById } from "@/server/db/visitors";
import eventDB from "@/server/db/events";
import { tonSocietyClient } from "@/lib/ton-society-api";
import telegramService from "@/server/routers/services/telegramService";
import rewardDB from "@/server/db/rewards.db";
import { logger } from "@/server/utils/logger";
import { getErrorMessages } from "@/lib/error";

async function sendRewardNotification(createdReward: RewardType) {
  try {
    logger.log("sendRewardNotification", createdReward);
    const visitor = await findVisitorById(createdReward.visitor_id);
    if (!visitor) {
      logger.error(`Visitor not found for reward ${createdReward.id}`);
      throw new Error("Visitor not found");
    }

    const event = await eventDB.fetchEventByUuid(visitor.event_uuid);

    if (!event) throw new Error("Event not found");

    const rewardRes = await tonSocietyClient.get<{
      status: "success";
      data: {
        status: "NOT_CLAIMED" | "CLAIMED";
      };
    }>(`/activities/${event.activity_id}/rewards/${visitor.user_id}/status`);

    if (rewardRes.data.data.status === "NOT_CLAIMED") {
      await telegramService.sendRewardNotification(createdReward, visitor, event);
    }

    await rewardDB.updateRewardStatus(createdReward.id, "notified");
  } catch (error) {
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

    await pushLockTTl();
    await sleep(1500);
  } while (createdRewards.length > 0);

  return offset;
};
