import { eventPayment, events, orders, rewards } from "@/db/schema";
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
import { and, asc, eq, or } from "drizzle-orm";
import { db } from "./db/db";
import { sleep } from "./utils";
import { CreateTonSocietyDraft } from "@/server/routers/events";
import { registerActivity } from "@/lib/ton-society-api";
import tonCenter from "@/server/routers/services/tonCenter";
import { is_mainnet } from "@/server/routers/services/tonCenter";
import { deployNftCollection } from "./lib/tonAssetSdk";
import { Cell } from "@ton/core";

process.on("unhandledRejection", (err) => {
  const messages = getErrorMessages(err);
  console.error("UNHANDLED ERROR", messages);
});

const CACHE_TTL = 40_000;

async function MainCronJob() {
  if (process.env.ENV?.toLocaleLowerCase() !== "production") {
    console.info("RUNNING Cron jobs on", process.env.ENV);
    await createRewards(() => null);
    console.info("RUNNING Cron jobs: createRewards done");
    await notifyUsersForRewards(() => null);
    console.info("RUNNING Cron jobs: notifyUsersForRewards done");
  }

  // Create Rewards Cron Job
  new CronJob("*/30 * * * *", cronJob(createRewards), null, true);

  // Notify Users Cron Job
  new CronJob("*/5 * * * *", cronJob(notifyUsersForRewards), null, true);

  new CronJob("*/30 * * * * *", cronJob(CheckTransactions), null, true);
}

function cronJob(fn: (_: () => any) => any) {
  const name = fn.name; // Get function name automatically
  const cacheLockKey = redisTools.cacheKeys.cronJobLock + name;

  return async () => {
    const cronLock = await redisTools.getCache(redisTools.cacheKeys.cronJobLock + name);

    if (cronLock) {
      console.log(`Cron job ${name} is already running`);
      return;
    }

    await redisTools.setCache(redisTools.cacheKeys.cronJobLock + name, true, CACHE_TTL);

    async function pushLockTTl() {
      try {
        return await redisTools.setRedisKeyTTL(cacheLockKey, CACHE_TTL);
      } catch (error) {
        console.error("REDIS_ERROR", getErrorMessages(error));
      }
    }

    try {
      console.time(`Cron job ${name} - ${cacheLockKey} duration`);
      await fn(pushLockTTl);
      console.timeEnd(`Cron job ${name} - ${cacheLockKey} duration`);
    } catch (err) {
      await sendLogNotification({
        message: `Cron job ${name} error: ${getErrorMessages(err)}`,
        topic: "system",
      });
    } finally {
      await redisTools.deleteCache(redisTools.cacheKeys.cronJobLock + name);
    }
  };
}

/* -------------------------------------------------------------------------- */
/*                                   Rewards                                  */
/* -------------------------------------------------------------------------- */

async function createRewards(pushLockTTl: () => any) {
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
    await pushLockTTl();
  } while (pendingRewards.length > 0);

  return offset;
}

async function processRewardChunk(pendingRewards: RewardType[]) {
  for (const pendingReward of pendingRewards) {
    try {
      const visitor = await findVisitorById(pendingReward.visitor_id);
      const event = await db.query.events.findFirst({
        where: (fields, { eq }) => eq(fields.event_uuid, visitor?.event_uuid as string),
      });

      const response = await createUserRewardLink(event?.activity_id as number, {
        telegram_user_id: visitor?.user_id as number,
        attributes: [{ trait_type: "Organizer", value: event?.society_hub as string }],
      });
      await sleep(100);
      await rewardDB.updateReward(pendingReward.id, response.data.data);
    } catch (error) {
      await handleRewardError(pendingReward, error);
    }
  }
}

async function notifyUsersForRewards(pushLockTTl: () => any) {
  const chunkSize = 15;
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
}

async function sendRewardNotification(createdReward: RewardType) {
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
      await telegramService.sendRewardNotification(createdReward, visitor, event);
    }

    await updateRewardStatus(createdReward.id, "notified");
  } catch (error) {
    console.error("BOT_API_ERROR", getErrorMessages(error));
    await handleRewardError(createdReward, error);
  }
}

async function updateRewardStatus(
  rewardId: string,
  status?: string,
  options?: {
    tryCount: number;
    data: any;
  }
) {
  const reward = (await db.select().from(rewards).where(eq(rewards.id, rewardId)))[0];

  await db
    .update(rewards)
    .set({
      status,
      ...(options?.data && {
        ...(typeof reward?.data === "object" && reward.data),
        ...options.data,
      }),
      tryCount: options?.tryCount,
      updatedBy: "system",
      updatedAt: new Date(),
    })
    .where(eq(rewards.id, rewardId));
}

async function handleRewardError(reward: RewardType, error: any) {
  const shouldFail = reward.tryCount >= 10;
  const newStatus = shouldFail ? "notification_failed" : undefined;
  const newData = shouldFail ? { fail_reason: error.message } : undefined;

  // console.error("handleRewardError", getErrorMessages(error), reward, shouldFail, newStatus, newData);

  try {
    await updateRewardStatus(reward.id, newStatus, {
      tryCount: reward.tryCount + 1,
      data: newData,
    });
  } catch (dbError) {
    console.error("DB_ERROR", dbError);
  }
}

/* -------------------------------------------------------------------------- */
/*                        Orders & Transaction Checker                        */
/* -------------------------------------------------------------------------- */
async function CheckTransactions(pushLockTTl: () => any) {
  // Get Orders to be Checked (Sort By Order.TicketDetails.Id)
  // Get Order.TicketDetails Wallet
  // Get Transactions From Past 30 Minutes
  // Update (DB) Paid Ones as paid others as failed
  const wallet_address = is_mainnet
    ? "0:39C29CE7E12B0EC24EF13FEC3FDEB677FE6A9202C4BA3B7DA77E893BF8A3BCE5"
    : "0QB_tZoxMDBObtHY3cwI1KK9dkE7-ceVrLgObgwmCRyWYCqW";
  const start_utime = Math.floor((Date.now() - 3 * 60 * 1000) / 1000);
  console.log(wallet_address, start_utime);
  const transactions = await tonCenter.fetchAllTransactions(wallet_address, 1734393600);
  console.log("Trx Len", transactions.length);
  const parsed_orders = await tonCenter.parseTransactions(transactions);
  for (const o of parsed_orders) {
    if (o.verfied) {
      console.log("cron_trx", o.order_uuid, o.order_type, o.value);
      await db
        .update(orders)
        .set({ state: "processing" })
        .where(
          and(
            eq(orders.uuid, o.order_uuid),
            or(eq(orders.state, "new"), eq(orders.state, "confirming")),
            eq(orders.total_price, o.value)
          )
        );
    }
  }
}

async function CreateEventOrders(pushLockTTl: () => any) {
  // Get Pending(paid) Orders to create event
  // Register ton society activity
  // create collection
  // Update (DB) Event (tonSociety data)
  // Update (DB) EventPayment (Collection Address)
  // Update (DB) Orders (mark order as completed)
  //todo : Minter Wallet Check
  const results = await db
    .select()
    .from(orders)
    .where(and(eq(orders.state, "processing"), eq(orders.order_type, "event_creation")))
    .execute();

  /* -------------------------------------------------------------------------- */
  /*                               Event Creation                               */
  /* -------------------------------------------------------------------------- */
  for (const order of results) {
    const event_uuid = order.event_uuid;
    if (!event_uuid) {
      console.error("CronJob--CreateOrUpdateEvent_Orders---eventUUID is null order=", order.uuid);
      continue;
    }
    const event = await db.select().from(events).where(eq(events.event_uuid, event_uuid)).execute();
    if (!event) {
      console.error("CronJob--CreateOrUpdateEvent_Orders---event is null event=", event_uuid);
      continue;
    }
    const eventData = event[0];
    const eventDraft = await CreateTonSocietyDraft(
      {
        title: eventData.title,
        subtitle: eventData.subtitle,
        description: eventData.description,
        location: eventData.location!,
        countryId: eventData.countryId,
        society_hub: { id: eventData.society_hub_id! },
        start_date: eventData.start_date,
        end_date: eventData.end_date,
        ts_reward_url: eventData.tsRewardImage,
        video_url: eventData.tsRewardVideo,
        eventLocationType: eventData.participationType,
      },
      event_uuid
    );
    const paymentInfo = (
      await db.select().from(eventPayment).where(eq(eventPayment.event_uuid, event_uuid)).execute()
    ).pop();
    // deployNftCollection
    if (!paymentInfo) {
      console.error("what the fuck : ", "event Does not have payment !!!");
    }

    let collectionAddress = "someCollectionAddress";
    if (paymentInfo && !paymentInfo?.collectionAddress) {
      collectionAddress = (
        await deployNftCollection(paymentInfo.title!, paymentInfo.description!, paymentInfo.ticketImage!)
      ).toRawString();
    }

    let ton_society_result = null;
    if (!eventData.activity_id) ton_society_result = await registerActivity(eventDraft);
    db.transaction(async (trx) => {
      if (ton_society_result) {
        await trx
          .update(events)
          .set({ activity_id: ton_society_result.data.activity_id, updatedBy: "cronjob", updatedAt: new Date() })
          .where(eq(events.event_uuid, event_uuid))
          .execute();
      }
      if (paymentInfo && collectionAddress) {
        await trx
          .update(eventPayment)
          .set({ collectionAddress: collectionAddress })
          .where(eq(eventPayment.id, paymentInfo.id))
          .execute();
      }

      await trx
        .update(orders)
        .set({ state: "completed", updatedBy: "cronjob", updatedAt: new Date() })
        .where(eq(orders.uuid, order.uuid))
        .execute();
    });
  }
}
async function UpdateEventCapacity(pushLockTTl: () => any) {
  const results = await db
    .select()
    .from(orders)
    .where(and(eq(orders.state, "processing"), eq(orders.order_type, "event_capacity_increment")))
    .execute();

  /* -------------------------------------------------------------------------- */
  /*                               Event Creation                               */
  /* -------------------------------------------------------------------------- */
  for (const order of results) {
    const event_uuid = order.event_uuid;
    if (!event_uuid) {
      console.error("CronJob--CreateOrUpdateEvent_Orders---eventUUID is null order=", order.uuid);
      continue;
    }
    const event = await db.select().from(events).where(eq(events.event_uuid, event_uuid)).execute();
    if (!event) {
      console.error("CronJob--CreateOrUpdateEvent_Orders---event is null event=", event_uuid);
      continue;
    }
    const eventData = event[0];
    const eventDraft = await CreateTonSocietyDraft(
      {
        title: eventData.title,
        subtitle: eventData.subtitle,
        description: eventData.description,
        location: eventData.location!,
        countryId: eventData.countryId,
        society_hub: { id: eventData.society_hub_id! },
        start_date: eventData.start_date,
        end_date: eventData.end_date,
        ts_reward_url: eventData.tsRewardImage,
        video_url: eventData.tsRewardVideo,
        eventLocationType: eventData.participationType,
      },
      event_uuid
    );
    const paymentInfo = (
      await db.select().from(eventPayment).where(eq(eventPayment.event_uuid, event_uuid)).execute()
    ).pop();
    // deployNftCollection
    if (!paymentInfo) {
      console.error("what the fuck : ", "event Does not have payment !!!");
    }

    let collectionAddress = "someCollectionAddress";
    if (paymentInfo && !paymentInfo?.collectionAddress) {
      collectionAddress = (
        await deployNftCollection(paymentInfo.title!, paymentInfo.description!, paymentInfo.ticketImage!)
      ).toRawString();
    }

    let ton_society_result = null;
    if (!eventData.activity_id) ton_society_result = await registerActivity(eventDraft);
    db.transaction(async (trx) => {
      if (ton_society_result) {
        await trx
          .update(events)
          .set({ activity_id: ton_society_result.data.activity_id, updatedBy: "cronjob", updatedAt: new Date() })
          .where(eq(events.event_uuid, event_uuid))
          .execute();
      }
      if (paymentInfo && collectionAddress) {
        await trx
          .update(eventPayment)
          .set({ collectionAddress: collectionAddress })
          .where(eq(eventPayment.id, paymentInfo.id))
          .execute();
      }

      await trx
        .update(orders)
        .set({ state: "completed", updatedBy: "cronjob", updatedAt: new Date() })
        .where(eq(orders.uuid, order.uuid))
        .execute();
    });
  }
}

async function MintNFTforPaid_Orders() {
  // Get Orders to be Minted
  // Mint NFT
  // Update (DB) Successful Minted Orders as Minted
}

// Run the Cron Jobs
MainCronJob();

