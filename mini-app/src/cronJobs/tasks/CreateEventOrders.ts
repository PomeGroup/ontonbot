import { db } from "@/db/db";
import { orders } from "@/db/schema/orders";
import { and, eq } from "drizzle-orm";
import { logger } from "@/server/utils/logger";
import eventDB from "@/server/db/events";
import { CreateTonSocietyDraft } from "@/server/routers/services/tonSocietyService";
import { eventPayment } from "@/db/schema/eventPayment";
import { registerActivity } from "@/lib/ton-society-api";
import { uploadJsonToMinio } from "@/lib/minioTools";
import { deployCollection } from "@/lib/nft";
import { is_mainnet } from "@/server/routers/services/tonCenter";
import { sendLogNotification, sendToEventsTgChannel } from "@/lib/tgBot";
import { events } from "@/db/schema/events";

export const CreateEventOrders = async () => {
  // Get Pending(paid) Orders to create event
  // Register ton society activity
  // create collection
  // Update (DB) Event (tonSociety data)
  // Update (DB) EventPayment (Collection Address)
  // Update (DB) Orders (mark order as completed)
  //todo : Minter Wallet Check
  // logger.log("!!! CreateEventOrders !!! ");

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
        logger.error("CronJob--CreateOrUpdateEvent_Orders---eventUUID is null order=", order.uuid);
        continue;
      }
      // const event = await db.select().from(events).where(eq(events.event_uuid, event_uuid)).execute();
      const event = await eventDB.selectEventByUuid(event_uuid);
      if (!event) {
        //NOTE - tg log
        logger.error("CronJob--CreateOrUpdateEvent_Orders---event is null event=", event_uuid);
        continue;
      }
      const eventData = event;
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
        logger.error("what the fuck : ", "event Does not have payment !!!");
      }

      /* -------------------------------------------------------------------------- */
      /*                          Create Ton Society Event                          */
      /* -------------------------------------------------------------------------- */
      let ton_society_result = undefined;
      if (!eventData.activity_id) ton_society_result = await registerActivity(eventDraft);

      /* -------------------------------------------------------------------------- */
      /*                              Create Collection                             */
      /* -------------------------------------------------------------------------- */
      let collectionAddress = paymentInfo?.collectionAddress || null;
      let collection_address_in_db = true;
      if (paymentInfo && !paymentInfo?.collectionAddress) {
        /* -------------------------------------------------------------------------- */
        /*                               NFT COLLECTION                               */
        /* -------------------------------------------------------------------------- */
        if (paymentInfo.ticket_type === "NFT") {
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

          logger.log("MetaDataUrl_CreateEvent_CronJob : " + metaDataUrl);

          /* ---------------------------- Collection Deploy --------------------------- */
          logger.log(`paid_event_deploy_collection_${eventData.event_uuid}`);
          collection_address_in_db = false;
          collectionAddress = await deployCollection(metaDataUrl);
          logger.log(`paid_event_deployed_collection_${eventData.event_uuid}_${collectionAddress}`);
          try {
            const prefix = is_mainnet ? "" : "testnet.";
            await sendLogNotification({
              message: `Deployed collection for <b>${eventData.title}</b>\n\n🎈<a href='https://${prefix}getgems.io/collection/${collectionAddress}'>Collection</a>\n\n👤Capacity: ${eventData.capacity}`,
              topic: "event",
            });
            await sendToEventsTgChannel({
              image: eventData.image_url,
              title: eventData.title,
              subtitle: eventData.subtitle,
              s_date: eventData.start_date,
              e_date: eventData.end_date,
              timezone: eventData.timezone,
              event_uuid: eventData.event_uuid,
            });
          } catch (error) {
            logger.log(`paid_event_deployed_collection_send_error_${event_uuid}_${error}`);
          }
        } else if (paymentInfo.ticket_type === "TSCSBT") {
          //No Collection Deploy
          collectionAddress = "tsCsbt-collection-address";
        }
      }

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
          await eventDB.deleteEventCache(event_uuid);
          logger.log(`paid_event_add_activity_${eventData.event_uuid}_${activity_id}`);
        }
        /* ------------------------ Update Collection Address ----------------------- */
        if (paymentInfo && collectionAddress) {
          await trx
            .update(eventPayment)
            .set({ collectionAddress: collectionAddress, updatedBy: "CreateEventOrders", updatedAt: new Date() })
            .where(eq(eventPayment.id, paymentInfo.id))
            .execute();
          collection_address_in_db = true;
          logger.log(`paid_event_add_collection_${eventData.event_uuid}_${collectionAddress}`);
        }

        /* ------------------------- Mark Order as Completed ------------------------ */
        if (paymentInfo && collection_address_in_db && (ton_society_result || eventData.activity_id)) {
          await trx
            .update(orders)
            .set({ state: "completed", updatedBy: "CreateEventOrders", updatedAt: new Date() })
            .where(eq(orders.uuid, order.uuid))
            .execute();
          logger.log(`paid_event_creation_completed_${eventData.event_uuid}`);
        }
      });
    } catch (error) {
      logger.log(`event_creation_error ${error}`);
    }
  }
};
