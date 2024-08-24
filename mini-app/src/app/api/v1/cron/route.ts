import { db } from "@/db/db";
import { rewards } from "@/db/schema";
import { cacheKeys, deleteCache, getCache, setCache } from "@/lib/cache";
import { sendTelegramMessage } from "@/lib/tgBot";
import { createUserRewardLink } from "@/lib/ton-society-api";
import { EventType, RewardType, VisitorsType } from "@/types/event.types";
import { rewardLinkZod } from "@/types/user.types";
import { AxiosError } from "axios";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import pLimit from "p-limit";

export async function GET() {
  // set lock in cache
  const cronLock = getCache(cacheKeys.cronJobLock);

  if (cronLock) {
    return NextResponse.json({
      message: "Cron job already running",
      now: Date.now(),
    });
  }
  // update lock in cache for 7h and 50m
  setCache(cacheKeys.cronJobLock, true, 28_200);
  try {
    const [res1, res2] = await Promise.allSettled([
      createRewards(),
      notifyUsersForRewards(),
    ]);

    return NextResponse.json({
      message: "Cron job executed successfully",
      now: Date.now(),
      res1: res1.status === "fulfilled" ? res1.value : res1.reason,
      res2: res2.status === "fulfilled" ? res2.value : res2.reason,
    });
  } finally {
    deleteCache(cacheKeys.cronJobLock);
  }
}

async function createRewards() {
  let pendingRewards = await db.query.rewards.findMany({
    where: (fields, { eq }) => {
      return eq(fields.status, "pending_creation");
    },
  });

  const createRewardPromises = pendingRewards.map(async (pendingReward) => {
    try {
      const visitor = await db.query.visitors.findFirst({
        where: (fields, { eq }) => {
          return eq(fields.id, pendingReward.visitor_id);
        },
      });

      const event = await db.query.events.findFirst({
        where: (fields, { eq }) => {
          return eq(fields.event_uuid, visitor?.event_uuid as string);
        },
      });

      const response = await createUserRewardLink(
        event?.activity_id as number,
        {
          telegram_user_id: visitor?.user_id as number,
          attributes: [
            {
              trait_type: "Organizer",
              value: event?.society_hub as string,
            },
          ],
        }
      );

      await db
        .update(rewards)
        .set({
          status: "created",
          data: response.data.data,
          updatedBy: "system",
        })
        .where(eq(rewards.id, pendingReward.id));
    } catch (error) {
      const isEventPublished =
        error instanceof AxiosError
          ? error.response?.data?.message !== "activity not found"
          : true;
      // if it was not published we will delete all the other rewards associated with this event from the loop
      if (!isEventPublished) {
        const visitor = await db.query.visitors.findFirst({
          where: (fields, { eq }) => {
            return eq(fields.id, pendingReward.visitor_id);
          },
        });

        const unpublishedEvent = await db.query.events.findFirst({
          where: (fields, { eq }) => {
            return eq(fields.event_uuid, visitor?.event_uuid as string);
          },
        });
        pendingRewards = pendingRewards.filter(async (r) => {
          const visitor = await db.query.visitors.findFirst({
            where: (fields, { eq }) => {
              return eq(fields.id, r.visitor_id);
            },
          });

          const event = await db.query.events.findFirst({
            where: (fields, { eq }) => {
              return eq(fields.event_uuid, visitor?.event_uuid as string);
            },
          });

          return event?.activity_id !== unpublishedEvent?.activity_id;
        });
      }

      const shouldFail = pendingReward.tryCount >= 5 && isEventPublished;

      if (isEventPublished || shouldFail) {
        try {
          await db
            .update(rewards)
            .set({
              tryCount: isEventPublished
                ? pendingReward.tryCount + 1
                : undefined,
              status: shouldFail ? "failed" : undefined,
              data: shouldFail ? { fail_reason: error } : undefined,
              updatedBy: "system",
            })
            .where(eq(rewards.id, pendingReward.id));
        } catch (error) {
          console.log("DB_ERROR_102", error);
        }
      }
      if (error instanceof AxiosError) {
        console.error("CRON_JOB_ERROR", error.message, error.response?.data);
      } else {
        console.error("CRON_JOB_ERROR", error);
      }
    }
  });
  await Promise.allSettled(createRewardPromises);
}

async function notifyUsersForRewards() {
  const limit = pLimit(25); // Limit concurrent requests to 25
  const createdRewards = await db.query.rewards.findMany({
    where: (fields, { eq }) => eq(fields.status, "created"),
  });

  console.log("createdRewards ", createdRewards.length);

  const notificationPromises = createdRewards.map((createdReward) =>
    limit(() => processReward(createdReward))
  );

  await Promise.allSettled(notificationPromises);

  return createdRewards.length;
}

async function processReward(createdReward: RewardType) {
  try {
    const visitor = await db.query.visitors.findFirst({
      where: (fields, { eq }) => eq(fields.id, createdReward.visitor_id),
    });

    if (!visitor) {
      throw new Error("Visitor not found");
    }

    const event = await db.query.events.findFirst({
      where: (fields, { eq }) => eq(fields.event_uuid, visitor.event_uuid),
    });

    if (!event) {
      throw new Error("Event not found");
    }

    await sendRewardNotification(createdReward, visitor, event);
    await updateRewardStatus(createdReward.id, "notified");
  } catch (error) {
    console.error("BOT_API_ERROR", error);
    await handleRewardError(createdReward, error);
  }
}

async function sendRewardNotification(
  reward: RewardType,
  visitor: VisitorsType,
  event: EventType
) {
  await sendTelegramMessage({
    link: rewardLinkZod.parse(reward.data).reward_link,
    chat_id: visitor.user_id as number,
    message: `Hey there, you just received your reward for ${event.title} event. Please click on the link below to claim it`,
  });
}

async function updateRewardStatus(
  rewardId: string,
  status?: string,
  data?: any
) {
  await db
    .update(rewards)
    .set({ status, ...(data && { data }), updatedBy: "system" })
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
    console.error("DB_ERROR_156", dbError);
  }
}

export const dynamic = "force-dynamic";
