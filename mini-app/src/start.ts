import { eventPayment, eventRegistrants, events, nftItems, orders, rewards, tickets, walletChecks } from "@/db/schema";
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
import { and, asc, eq, isNotNull, lt, or, sql } from "drizzle-orm";
import { db } from "./db/db";
import { sleep } from "./utils";
import { CreateTonSocietyDraft } from "@/server/routers/services/tonSocietyService";
import { registerActivity } from "@/lib/ton-society-api";
import tonCenter from "@/server/routers/services/tonCenter";
import { is_mainnet } from "@/server/routers/services/tonCenter";

import { deployCollection, mintNFT } from "@/lib/nft";
import { uploadJsonToMinio } from "@/lib/minioTools";
import { Address } from "@ton/core";
import { config } from "./server/config";
import { selectUserById } from "./server/db/users";

process.on("unhandledRejection", (err) => {
  const messages = getErrorMessages(err);
  console.error("UNHANDLED ERROR", messages);
});

const CACHE_TTL = 40_000;

async function MainCronJob() {
  console.log("====> RUNNING Cron jobs on", process.env.ENV);
  if (process.env.ENV?.toLocaleLowerCase() !== "production") {
    // await createRewards(() => null);
    // console.log.info("RUNNING Cron jobs: createRewards done");
    // await notifyUsersForRewards(() => null);
    // console.log.info("RUNNING Cron jobs: notifyUsersForRewards done");
  }

  // Create Rewards Cron Job
  new CronJob("*/6 * * * *", cronJob(createRewards), null, true);

  // Notify Users Cron Job
  new CronJob("*/3 * * * *", cronJob(notifyUsersForRewards), null, true);

  new CronJob("*/1 * * * *", sendPaymentReminder, null, true);

  new CronJob("*/7 * * * * *", CheckTransactions, null, true);

  new CronJob("*/24 * * * * *", cronJob(UpdateEventCapacity), null, true);

  new CronJob("*/19 * * * * *", cronJob(CreateEventOrders), null, true);

  new CronJob("*/9 * * * * *", cronJob(MintNFTforPaid_Orders), null, true);
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
      console.log(`Cron job ${name} error: ${getErrorMessages(err)} \n\n`, err);
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
/* -------------------------------------------------------------------------- */
/*                                Transactions                                */
/* -------------------------------------------------------------------------- */
async function CheckTransactions(pushLockTTl: () => any) {
  // Get Orders to be Checked (Sort By Order.TicketDetails.Id)
  // Get Order.TicketDetails Wallet
  // Get Transactions From Past 30 Minutes
  // Update (DB) Paid Ones as paid others as failed
  // console.log("@@@@ CheckTransactions  @@@@");

  const wallet_address = config?.ONTON_WALLET_ADDRESS;

  if (!wallet_address) {
    console.error("ONTON_WALLET_ADDRESS NOT SET");
    return;
  }
  const hour_ago = Math.floor((Date.now() - 3600 * 1000) / 1000);
  const wallet_checks_details = await db
    .select({ checked_lt: walletChecks.checked_lt })
    .from(walletChecks)
    .where(eq(walletChecks.wallet_address, wallet_address || ""))
    .execute();

  let start_lt = null;
  if (wallet_checks_details && wallet_checks_details.length) {
    if (wallet_checks_details[0]?.checked_lt) {
      start_lt = wallet_checks_details[0].checked_lt + BigInt(1);
    }
  }

  const start_utime = start_lt ? null : hour_ago;

  const transactions = await tonCenter.fetchAllTransactions(wallet_address, start_utime, start_lt);
  const parsed_orders = await tonCenter.parseTransactions(transactions);

  for (const o of parsed_orders) {
    if (o.verfied) {
      console.log("cron_trx_", o.order_uuid, o.order_type, o.value);
      await db
        .update(orders)
        .set({ state: "processing", owner_address: o.owner.toString(), trx_hash: o.trx_hash })
        .where(
          and(
            eq(orders.uuid, o.order_uuid),
            or(eq(orders.state, "new"), eq(orders.state, "confirming")),
            eq(orders.total_price, o.value),
            eq(orders.payment_type, o.order_type)
          )
        );
    }
  }

  //-- Finished Checking
  if (transactions && transactions.length) {
    const last_lt = BigInt(transactions[transactions.length - 1].lt);
    if (start_lt) {
      await db
        .update(walletChecks)
        .set({ checked_lt: last_lt })
        .where(eq(walletChecks.wallet_address, wallet_address))
        .execute();
    } else {
      await db.insert(walletChecks).values({ wallet_address: wallet_address, checked_lt: last_lt }).execute();
    }
  }
}

/* -------------------------------------------------------------------------- */
/*                             Create Event Orders                            */
/* -------------------------------------------------------------------------- */
async function CreateEventOrders(pushLockTTl: () => any) {
  // Get Pending(paid) Orders to create event
  // Register ton society activity
  // create collection
  // Update (DB) Event (tonSociety data)
  // Update (DB) EventPayment (Collection Address)
  // Update (DB) Orders (mark order as completed)
  //todo : Minter Wallet Check
  // console.log("!!! CreateEventOrders !!! ");

  const results = await db
    .select()
    .from(orders)
    .where(and(eq(orders.state, "processing"), eq(orders.order_type, "event_creation")))
    .execute();

  /* -------------------------------------------------------------------------- */
  /*                               Event Creation                               */
  /* -------------------------------------------------------------------------- */
  for (const order of results) {
    try {
      const event_uuid = order.event_uuid;
      if (!event_uuid) {
        //NOTE - tg log
        console.error("CronJob--CreateOrUpdateEvent_Orders---eventUUID is null order=", order.uuid);
        continue;
      }
      const event = await db.select().from(events).where(eq(events.event_uuid, event_uuid)).execute();
      if (!event) {
        //NOTE - tg log
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

      if (!paymentInfo) {
        //NOTE - tg log
        console.error("what the fuck : ", "event Does not have payment !!!");
      }

      /* -------------------------------------------------------------------------- */
      /*                              Create Collection                             */
      /* -------------------------------------------------------------------------- */
      let collectionAddress = paymentInfo?.collectionAddress || null;
      let collection_address_in_db = true;
      if (paymentInfo && !paymentInfo?.collectionAddress) {
        /* -------------------------------------------------------------------------- */
        /* ----------------------------- MetaData Upload ---------------------------- */
        let metaDataUrl = "";
        metaDataUrl = await uploadJsonToMinio(
          {
            name: paymentInfo?.title,
            description: paymentInfo?.description,
            image: paymentInfo?.ticketImage,
            cover_image: paymentInfo?.ticketImage,
          },
          "ontoncollection"
        );
        if (!metaDataUrl) continue; //failed

        console.log("MetaDataUrl_CreateEvent_CronJob : " + metaDataUrl);

        /* ---------------------------- Collection Deploy --------------------------- */
        console.log(`paid_event_deploy_collection_${eventData.event_uuid}`);
        collection_address_in_db = false;
        collectionAddress = await deployCollection(metaDataUrl);
        console.log(`paid_event_deployed_collection_${eventData.event_uuid}_${collectionAddress}`);
        try {
          await sendLogNotification({
            message: `deployed collection for ${eventData.title}\n ${collectionAddress}`,
            topic: "event",
          });
        } catch (error) {
          console.log(`paid_event_deployed_collection_send_error_${event_uuid}_${error}`);
        }
      }

      /* -------------------------------------------------------------------------- */
      /*                          Create Ton Society Event                          */
      /* -------------------------------------------------------------------------- */
      let ton_society_result = undefined;
      if (!eventData.activity_id) ton_society_result = await registerActivity(eventDraft);

      /* -------------------------------------------------------------------------- */
      /*                                  Update DB                                 */
      /* -------------------------------------------------------------------------- */
      await db.transaction(async (trx) => {
        /* --------------------------- Update Activity Id --------------------------- */
        if (eventData.activity_id || ton_society_result) {
          const activity_id = eventData.activity_id || ton_society_result!.data.activity_id;
          await trx
            .update(events)
            .set({
              activity_id: activity_id,
              hidden: false,
              enabled: true,
              updatedBy: "CreateEventOrders-JOB",
              updatedAt: new Date(),
            })
            .where(eq(events.event_uuid, event_uuid))
            .execute();
          console.log(`paid_event_add_activity_${eventData.event_uuid}_${activity_id}`);
        }
        /* ------------------------ Update Collection Address ----------------------- */
        if (paymentInfo && collectionAddress) {
          await trx
            .update(eventPayment)
            .set({ collectionAddress: collectionAddress, updatedBy: "CreateEventOrders", updatedAt: new Date() })
            .where(eq(eventPayment.id, paymentInfo.id))
            .execute();
          collection_address_in_db = true;
          console.log(`paid_event_add_collection_${eventData.event_uuid}_${collectionAddress}`);
        }

        /* ------------------------- Mark Order as Completed ------------------------ */
        if (paymentInfo && collection_address_in_db && (ton_society_result || eventData.activity_id)) {
          await trx
            .update(orders)
            .set({ state: "completed", updatedBy: "CreateEventOrders", updatedAt: new Date() })
            .where(eq(orders.uuid, order.uuid))
            .execute();
          console.log(`paid_event_cration_completed_${eventData.event_uuid}`);
        }
      });
    } catch (error) {
      console.log(`event_creation_error ${error}`);
    }
  }
}

/* -------------------------------------------------------------------------- */
/*                            Event Update Capacity                           */
/* -------------------------------------------------------------------------- */
async function UpdateEventCapacity(pushLockTTl: () => any) {
  const results = await db
    .select()
    .from(orders)
    .where(and(eq(orders.state, "processing"), eq(orders.order_type, "event_capacity_increment")))
    .execute();

  /* -------------------------------------------------------------------------- */
  /*                               Event UPDATE                                 */
  /* -------------------------------------------------------------------------- */
  for (const order of results) {
    try {
      const event_uuid = order.event_uuid;
      if (!event_uuid) {
        //NOTE - tg log
        console.error("error_CronJob--CreateOrUpdateEvent_Orders---eventUUID is null order=", order.uuid);
        continue;
      }
      const event = await db.select().from(events).where(eq(events.event_uuid, event_uuid)).execute();
      if (!event) {
        //NOTE - tg log
        console.error("error_CronJob--CreateOrUpdateEvent_Orders---event is null event=", event_uuid);
        continue;
      }
      const eventData = event[0];

      const paymentInfo = (
        await db.select().from(eventPayment).where(eq(eventPayment.event_uuid, event_uuid)).execute()
      ).pop();

      if (!paymentInfo) {
        //NOTE - tg log
        console.error("error_what the fuck : ", "event Does not have payment !!!");
        continue;
      }

      await db.transaction(async (trx) => {
        const newCapacity = Number(paymentInfo?.bought_capacity! + order.total_price / 0.055);

        await trx.update(events).set({ capacity: newCapacity }).where(eq(events.event_uuid, eventData.event_uuid)).execute();
        await trx
          .update(eventPayment)
          .set({ bought_capacity: newCapacity })
          .where(eq(eventPayment.event_uuid, eventData.event_uuid))
          .execute();
        await trx.update(orders).set({ state: "completed" }).where(eq(orders.uuid, order.uuid)).execute();
      });
    } catch (error) {
      console.error(`UpdateEventCapacity_error ${error}`);
    }
  }
}

/* -------------------------------------------------------------------------- */
/*                                 NFT Minter                                 */
/* -------------------------------------------------------------------------- */
async function MintNFTforPaid_Orders(pushLockTTl: () => any) {
  // Get Orders to be Minted
  // Mint NFT
  // Update (DB) Successful Minted Orders as Minted
  // console.log("&&&& MintNFT &&&&");
  const results = await db
    .select()
    .from(orders)
    .where(and(eq(orders.state, "processing"), eq(orders.order_type, "nft_mint")))
    .orderBy(asc(orders.created_at))
    .limit(100)
    .execute();

  /* -------------------------------------------------------------------------- */
  /*                               ORDER PROCCESS                               */
  /* -------------------------------------------------------------------------- */
  for (const ordr of results) {
    await pushLockTTl();
    try {
      const event_uuid = ordr.event_uuid;

      if (!ordr.owner_address) {
        //NOTE -  tg error
        console.error("error_wtf : no owner address", "order_id=", ordr.uuid);
        continue;
      }
      try {
        Address.parse(ordr.owner_address);
      } catch {
        //NOTE - tg error
        console.error("error_uparsable address : ", ordr.owner_address, "order_id=", ordr.uuid);
        continue;
      }

      const paymentInfo = (
        await db.select().from(eventPayment).where(eq(eventPayment.event_uuid, event_uuid)).execute()
      ).pop();

      if (!paymentInfo) {
        console.error("error_what the fuck : ", "event Does not have payment !!!", event_uuid);
        continue;
      }
      if (!paymentInfo.collectionAddress) {
        console.error(" no colleciton address right now");
        continue;
      }
      const meta_data_url = await uploadJsonToMinio(
        {
          name: paymentInfo.title,
          description: paymentInfo.description,
          image: paymentInfo?.ticketImage,
          attributes: {
            order_id: ordr.uuid,
            ref: ordr.utm_source || "onton",
          },
          buttons: [
            {
              label: "Join The Onton Event",
              uri: `https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME}/event?startapp=${event_uuid}`,
            },
          ],
        },
        "ontonitem"
      );
      // const approved_users = db.select().from(eventRegistrants).where(
      //   and(
      //     eq(eventRegistrants.event_uuid , event_uuid),
      //     eq(eventRegistrants)
      //   )
      // )
      const nft_count_result = await db
        .select({ count: sql`count(*)`.mapWith(Number) })
        .from(nftItems)
        .where(eq(nftItems.event_uuid, event_uuid))
        .execute();

      const nft_index = nft_count_result[0].count || 0;

      console.log(`minting_nft_${ordr.event_uuid}_${nft_index}_${paymentInfo?.collectionAddress}_${meta_data_url}`);

      const nft_address = await mintNFT(ordr.owner_address, paymentInfo?.collectionAddress, nft_index, meta_data_url);
      if (!nft_address) {
        console.log(`minting_nft_${ordr.event_uuid}_${nft_index}_address_miss`);
        return;
      }
      console.log(`minting_nft_${ordr.event_uuid}_${nft_index}_address_${nft_address}`);
      /* -------------------------------------------------------------------------- */
      try {
        const prefix = is_mainnet ? "" : "testnet.";
        let username = "GIFT-USER";
        if (ordr.user_id) username = (await selectUserById(ordr.user_id!))?.username || username;

        await sendLogNotification({
          message: `NFT ${nft_index + 1}
<b>${paymentInfo.title}</b>
👤user_id : <code>${ordr.user_id}</code>
👤username : @${username}
<a href='https://${prefix}getgems.io/collection/${paymentInfo.collectionAddress}'>🎨Collection</a>
<a href='https://${prefix}tonviewer.com/${ordr.trx_hash}'>💰TRX</a>
          `,
          topic: "ticket",
        });
        /* -------------------------------------------------------------------------- */
      } catch (error) {
        console.error("MintNFTforPaid_Orders-sendLogNotification-error--:", error);
      }

      await db.transaction(async (trx) => {
        await trx.update(orders).set({ state: "completed" }).where(eq(orders.uuid, ordr.uuid)).execute();
        console.log(`nft_mint_order_completed_${ordr.uuid}`);
        await trx
          .insert(nftItems)
          .values({
            event_uuid: event_uuid,
            order_uuid: ordr.uuid,
            nft_address: nft_address,
            owner: ordr.user_id,
          })
          .execute();

        console.log(`nft_mint_nftitem_add_${ordr.user_id}_${nft_address}`);

        if (ordr.user_id) {
          // if ordr.user_id === null order is manual mint(Gift)
          await trx
            .update(eventRegistrants)
            .set({ status: "approved" })
            .where(
              and(
                eq(eventRegistrants.event_uuid, ordr.event_uuid),
                eq(eventRegistrants.user_id, ordr.user_id),
                or(eq(eventRegistrants.status, "pending"), eq(eventRegistrants.status, "rejected"))
              )
            )
            .execute();

          console.log(`nft_mint_user_approved_${ordr.user_id}`);
        }
      });

      // await pushLockTTl();
    } catch (error) {
      console.log(`nft_mint_error , ${error}`);
    }
  }
}

/* -------------------------------------------------------------------------- */
/*                        Payment to Organizer Reminder                       */
/* -------------------------------------------------------------------------- */
async function sendPaymentReminder() {
  console.log("sendPaymentReminder");
  const currentTimestamp = Math.floor(Date.now() / 1000); // Current timestamp in seconds
  const oneDayInSeconds = 24 * 60 * 60;

  const events_need_of_remind = await db
    .select()
    .from(eventPayment)
    .innerJoin(events, eq(eventPayment.event_uuid, events.event_uuid))
    .where(
      and(eq(eventPayment.organizer_payment_status, "not_payed"), lt(events.end_date, currentTimestamp - oneDayInSeconds))
    )
    .execute();

  for (const event of events_need_of_remind) {
    const title = event.events.title;
    const recipient_address = event.event_payment_info.recipient_address;
    const payment_type = event.event_payment_info.payment_type;
    const payment_type_emojis = payment_type == "TON" ? "🔹" : "💲"; 

    console.log("event ", title);
    const totalAmount = await db
      .select({
        totalPrice: sql`SUM(${orders.total_price})`, // Calculates the sum of total_price
      })
      .from(orders)
      .where(
        and(
          isNotNull(orders.trx_hash), // Ensures trx_hash is not null
          eq(orders.event_uuid, event.events.event_uuid),
          eq(orders.order_type, "nft_mint"),
          eq(orders.state, "completed")
        )
      )
      .execute();

    let payment_amount = 0;
    let commission = 0;
    let total = 0;
    if (totalAmount.length > 0 && totalAmount[0].totalPrice) {
      total = Number(totalAmount[0].totalPrice!);
      commission = total * 0.05; // The 5% Commistion
      payment_amount = total - commission;
    }
    const message_result = await sendLogNotification({
      message: `Payment For Event
<b>${title}</b>
Total Sold : ${total}
Commision : <code>${commission}</code>

Payment Type : <b>${payment_type}</b>${payment_type_emojis}
Organizer Payment : <code>${payment_amount}</code>
Recipient : <code>${recipient_address}</code>
`,
      topic: "ticket",
    });

    if (message_result.message_id) {
      //Successful Message send
      await db
        .update(eventPayment)
        .set({ organizer_payment_status: "payed_to_organizer" })
        .where(eq(eventPayment.id, event.event_payment_info.id))
        .execute();
    }

    await sleep(1000);
  }
}
// Run the Cron Jobs
MainCronJob();
// CreateEventOrders().finally(() => console.log("well done ........"));
