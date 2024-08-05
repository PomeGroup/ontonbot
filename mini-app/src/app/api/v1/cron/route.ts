import { db } from "@/db/db";
import { rewards } from "@/db/schema";
import { createUserRewardLink } from "@/lib/ton-society-api";
import { EventType, RewardType, VisitorsType } from "@/types/event.types";
import { rewardLinkZod } from "@/types/user.types";
import axios, { AxiosError } from "axios";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import pLimit from "p-limit";

export async function GET() {
  try {
    await createRewards();
  } catch (error) {
    console.error("ERROR_IN_CREATE_REWARDS: ", error);
  }

  try {
    await notifyUsersForRewards();
  } catch (error) {
    console.error("ERROR_IN_NOTIFICATION: ", error);
  }

  return NextResponse.json({
    message: "Cron job executed successfully",
    now: Date.now(),
  });
}

async function createRewards() {
  let pendingRewards = await db.query.rewards.findMany({
    where: (fields, { eq }) => {
      return eq(fields.status, "pending_creation");
    },
  });

  console.log("pendingRewards", pendingRewards.length);

  // create reward ton society integration
  for (const pendingReward of pendingRewards) {
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
  }
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

    await sendTelegramMessage(createdReward, visitor, event);
    await updateRewardStatus(createdReward.id, "notified");
  } catch (error) {
    console.error("BOT_API_ERROR", error);
    await handleRewardError(createdReward, error);
  }
}

async function sendTelegramMessage(
  reward: RewardType,
  visitor: VisitorsType,
  event: EventType
) {
  await axios.post("http://telegram-bot:3333/send-message", {
    link: rewardLinkZod.parse(reward.data).reward_link,
    chat_id: visitor.user_id,
    custom_message: `Hey there, you just received your reward for ${event.title} event. Please click on the link below to claim it`,
  });
}

async function updateRewardStatus(
  rewardId: string,
  status?: string,
  data?: any
) {
  await db
    .update(rewards)
    .set({ status, ...(data && { data }) })
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
