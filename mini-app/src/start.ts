import { rewards } from "@/db/schema";
import { getErrorMessages } from "@/lib/error";
import { redisTools } from "@/lib/redisTools";
import { sendLogNotification } from "@/lib/tgBot";
import { createUserRewardLink, tonSocietyClient } from "@/lib/ton-society-api";
import rewardDB from "@/server/db/rewards.db";
import { findVisitorById } from "@/server/db/visitors";
import telegramService from "@/server/routers/services/telegramService";
import { RewardType } from "@/types/event.types";
import { CronJob } from "cron";
import "dotenv/config";
import { asc, eq } from "drizzle-orm";
import pLimit from "p-limit";
import { db } from "./db/db";
import { sleep } from "./utils";

new CronJob("*/30 * * * *", cronJobRunner(createRewards), null, true);

new CronJob("*/5 * * * *", cronJobRunner(notifyUsersForRewards), null, true);

process.on("unhandledRejection", (err) => {
  console.error("START", err);
});

function cronJobRunner(fn: () => any) {
  const name = fn.name; // Get function name automatically
  return async () => {
    const cronLock = await redisTools.getCache(
      redisTools.cacheKeys.cronJobLock + name
    );

    if (cronLock) {
      console.log(`Cron job ${name} is already running`);
      return;
    }

    // 8h ttl
    await redisTools.setCache(
      redisTools.cacheKeys.cronJobLock + name,
      true,
      28_800_000
    );

    try {
      await fn();
    } catch (err) {
      await sendLogNotification({
        message: `Cron job ${name} error: ${getErrorMessages(err)}`,
      });
    } finally {
      await redisTools.deleteCache(redisTools.cacheKeys.cronJobLock + name);
    }
  };
}

async function createRewards() {
  let pendingRewards: RewardType[] = [];
  let offset = 0;

  do {
    pendingRewards = await db.query.rewards.findMany({
      where: (fields, { eq }) => eq(fields.status, "pending_creation"),
      limit: 100,
      offset,
      orderBy: [asc(rewards.created_at)],
    });

    offset += pendingRewards.length;

    await processRewardChunk(pendingRewards);
    await sleep(100);
  } while (pendingRewards.length > 0);

  return offset;
}

async function processRewardChunk(pendingRewards: RewardType[]) {
  for (const pendingReward of pendingRewards) {
    try {
      const visitor = await findVisitorById(pendingReward.visitor_id);
      const event = await db.query.events.findFirst({
        where: (fields, { eq }) =>
          eq(fields.event_uuid, visitor?.event_uuid as string),
      });

      const response = await createUserRewardLink(
        event?.activity_id as number,
        {
          telegram_user_id: visitor?.user_id as number,
          attributes: [
            { trait_type: "Organizer", value: event?.society_hub as string },
          ],
        }
      );

      await rewardDB.updateReward(pendingReward.id, response.data.data);
    } catch (error) {
      await handleRewardError(pendingReward, error);
    }
  }
}

async function notifyUsersForRewards() {
  const chunkSize = 100;
  const limit = pLimit(25);
  let offset = 0;
  let createdRewards: RewardType[] = [];

  do {
    createdRewards = await db.query.rewards.findMany({
      where: (fields, { eq }) => eq(fields.status, "created"),
      limit: chunkSize,
      offset,
    });

    offset += createdRewards.length;

    const notificationPromises = createdRewards.map((createdReward) =>
      limit(() => processReward(createdReward))
    );

    await Promise.allSettled(notificationPromises);
  } while (createdRewards.length > 0);

  return offset;
}

async function processReward(createdReward: RewardType) {
  try {
    const visitor = await findVisitorById(createdReward.visitor_id);
    if (!visitor) throw new Error("Visitor not found");

    const event = await db.query.events.findFirst({
      where: (fields, { eq }) => eq(fields.event_uuid, visitor.event_uuid),
    });

    if (!event) throw new Error("Event not found");

    const rewardRes = await tonSocietyClient.get<{
      status: "success";
      data: {
        status: "NOT_CLAIMED" | "CLAIMED";
      };
    }>(`/activities/${event.activity_id}/rewards/${visitor.user_id}/status`);

    if (rewardRes.data.data.status === "NOT_CLAIMED") {
      await telegramService.sendRewardNotification(
        createdReward,
        visitor,
        event
      );
    }

    await updateRewardStatus(createdReward.id, "notified");
  } catch (error) {
    console.error("BOT_API_ERROR", error);
    await handleRewardError(createdReward, error);
  }
}

async function updateRewardStatus(
  rewardId: string,
  status?: string,
  data?: any
) {
  await db
    .update(rewards)
    .set({
      status,
      ...(data && { data }),
      updatedBy: "system",
      updatedAt: new Date(),
    })
    .where(eq(rewards.id, rewardId));
}

async function handleRewardError(reward: RewardType, error: any) {
  const shouldFail = reward.tryCount >= 4;
  const newStatus = shouldFail ? "notification_failed" : undefined;
  const newData = shouldFail ? { fail_reason: error.message } : undefined;

  try {
    await updateRewardStatus(reward.id, newStatus, {
      tryCount: reward.tryCount + 1,
      ...newData,
    });
  } catch (dbError) {
    console.error("DB_ERROR", dbError);
  }
}
