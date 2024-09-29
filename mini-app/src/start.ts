import { rewards } from "@/db/schema";
import { cacheKeys, deleteCache, getCache, setCache } from "@/lib/cache";
import { getErrorMessages } from "@/lib/error";
import { sendLogNotification, sendTelegramMessage } from "@/lib/tgBot";
import { createUserRewardLink } from "@/lib/ton-society-api";
import { msToTime } from "@/lib/utils";
import { EventType, RewardType, VisitorsType } from "@/types/event.types";
import { rewardLinkZod } from "@/types/user.types";
import { AxiosError } from "axios";
import { CronJob } from "cron";
import "dotenv/config";
import { eq, sql } from "drizzle-orm";
import pLimit from "p-limit";
import { db } from "./db/db";
import { wait } from "./lib/utils";

new CronJob("0 */2 * * *", cronJobFunction, null, true);

process.on("unhandledRejection", (err) => {
  console.error("START", err);
});

cronJobFunction();

async function cronJobFunction() {
  const startTime = Date.now();

  const cronLock = getCache(cacheKeys.cronJobLock);

  if (cronLock) {
    console.log("Cron job is already running");
    return;
  }
  // 8h ttl
  setCache(cacheKeys.cronJobLock, true, 28_800_000);
  void Promise.allSettled([createRewards(), notifyUsersForRewards()])
    .then(([createdRewards, notifiedUsers]) => {
      const endTime = Date.now();
      const duration = msToTime(endTime - startTime);

      void sendLogNotification({
        message: `
✅ Cron job executed successfully at ${new Date().toISOString()}

<pre><code>
${JSON.stringify({ createdRewards, notifiedUsers, duration }, null, 2)}
</code></pre>

`,
      });
    })
    .catch(
      (err) =>
        void sendLogNotification({
          message: `
❌ Cron job failed at ${new Date().toISOString()}

<pre><code>
${getErrorMessages(err).join("\n\n")}
</code></pre>
`,
        })
    )
    .finally(() => {
      deleteCache(cacheKeys.cronJobLock);
    });
}

async function createRewards() {
  if (process.env.ENV === "staging") {
    // on stage we simulate a 1hour delay
    await wait(1000 * 60 * 60);
  }

  const pendingRewardCount = await db
    .select({ count: sql`count(*)`.mapWith(Number) })
    .from(rewards)
    .where(eq(rewards.status, "pending_creation"));

  if (pendingRewardCount[0].count === 0) {
    return 0;
  }

  // for pending rewards count divided by 100 round up to 3
  const pendingRewardsCount = Math.ceil(pendingRewardCount[0].count / 100);

  for (let i = 0; i < pendingRewardsCount; i++) {
    let pendingRewards = await db.query.rewards.findMany({
      where: (fields, { eq }) => {
        return eq(fields.status, "pending_creation");
      },
      limit: 100,
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
            updatedAt: new Date(),
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
                updatedAt: new Date(),
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

  return pendingRewardCount[0].count;
}

async function notifyUsersForRewards() {
  const limit = pLimit(25); // Limit concurrent requests to 25
  const createdRewardCount = await db
    .select({ count: sql`count(*)`.mapWith(Number) })
    .from(rewards)
    .where(eq(rewards.status, "created"));

  if (createdRewardCount[0].count === 0) {
    return 0;
  }

  // for pending rewards count divided by 100 round up to 3
  const createdRewardsCount = Math.ceil(createdRewardCount[0].count / 100);

  for (let i = 0; i < createdRewardsCount; i++) {
    const createdRewards = await db.query.rewards.findMany({
      where: (fields, { eq }) => eq(fields.status, "created"),
      limit: 100,
    });

    const notificationPromises = createdRewards.map((createdReward) =>
      limit(() => processReward(createdReward))
    );

    await Promise.allSettled(notificationPromises);
  }

  return createdRewardCount[0].count;
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
    console.error("DB_ERROR_156", dbError);
  }
}
