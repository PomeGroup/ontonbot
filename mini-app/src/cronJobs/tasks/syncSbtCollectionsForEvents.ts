import { db } from "@/db/db";
import { events } from "@/db/schema/events";
import { eq, and, isNull, isNotNull, not, desc } from "drizzle-orm";

import eventDB from "@/server/db/events";
import { logger } from "@/server/utils/logger";
import { getFullActivityDetails } from "@/lib/ton-society-api";
import { sleep } from "@/utils";
import { sendLogNotificationWithCsv } from "@/lib/tgBot";
import { csvEscape, formatCountMessage } from "../helper/syncSbtCollectionsForEvent.helpers";

const BATCH_SIZE = 30000; // do not change this value. this will break the code

export const syncSbtCollectionsForEvents = async () => {
  let offset = 0;

  // Arrays to track problem cases
  const notFoundOrErrorEvents: {
    eventUuid: string;
    Title: string;
    activityId: number;
    error: string;
    createdAt: Date | null;
  }[] = [];
  const noCollectionEvents: {
    eventUuid: string;
    Title: string;
    activityId: number;
    createdAt: Date | null;
  }[] = [];

  // 1) Loop in batches to find events missing SBT collection address
  while (true) {
    await sleep(100); // Small delay to avoid spamming the external API
    const pendingEvents = await db
      .select({
        eventUuid: events.event_uuid,
        activityId: events.activity_id,
        title: events.title,
        createdAt: events.created_at,
      })
      .from(events)
      .where(
        and(
          isNotNull(events.activity_id),
          eq(events.hidden, false),
          not(eq(events.activity_id, -100)),
          isNull(events.sbt_collection_address)
        )
      )
      .orderBy(desc(events.event_id))
      .limit(BATCH_SIZE)
      .offset(offset);
    logger.info(`Found ${pendingEvents.length} events missing sbt_collection_address`);

    if (pendingEvents.length === 0) {
      break; // no more events to process
    }
    offset += pendingEvents.length;

    // 2) For each event in this batch, try fetching from Ton Society
    for (const evt of pendingEvents) {
      try {
        const activityResponse = await getFullActivityDetails(evt.activityId!!);
        const sbt_collection_address = activityResponse.data?.rewards?.collection_address;

        if (sbt_collection_address) {
          // Update your DB record
          await db.update(events).set({ sbt_collection_address }).where(eq(events.event_uuid, evt.eventUuid)).execute();

          // Clear event cache
          await eventDB.deleteEventCache(evt.eventUuid);

          logger.info(
            `Updated event "${evt.eventUuid}" with sbt_collection_address: ${sbt_collection_address} (activity ${evt.activityId})`
          );
        } else {
          // No collection address from the API
          noCollectionEvents.push({
            eventUuid: evt.eventUuid,
            Title: evt.title,
            activityId: evt.activityId!!,
            createdAt: evt.createdAt,
          });
          logger.info(`No sbt_collection_address in activity ${evt.activityId} for event "${evt.eventUuid}"`);
        }

        // Small delay to avoid spamming the external API
        await sleep(100);
      } catch (error: any) {
        // Keep track of errors
        notFoundOrErrorEvents.push({
          eventUuid: evt.eventUuid,
          Title: evt.title,
          activityId: evt.activityId!!,
          error: String(error.message || error),
          createdAt: evt.createdAt,
        });
        logger.error(`Failed to sync sbt_collection_address for event "${evt.eventUuid}"`, error);
      }
    }
  }

  // 3) Build a final summary message with red/green indicators
  const missingMsg = formatCountMessage(noCollectionEvents.length, "event missing collection", "events missing collection");
  const errorMsg = formatCountMessage(notFoundOrErrorEvents.length, "error", "errors");
  const finalMessage = `<b>🔄 SBT Sync Completed</b>\n${missingMsg}\n${errorMsg}`;

  // 4) If we have any problem events, attach them in a CSV. Otherwise, just send a plain text notification
  if (noCollectionEvents.length > 0 || notFoundOrErrorEvents.length > 0) {
    // Build CSV with both missing-collection events + error events
    const csvRows = ["event_uuid,Title,activity_id,error_message,CreationDate"];

    // Error events
    for (const ev of notFoundOrErrorEvents) {
      const sanitizedError = ev.error.replace(/[\r\n]/g, " ");
      csvRows.push(
        [csvEscape(ev.eventUuid), csvEscape(ev.Title), ev.activityId, csvEscape(sanitizedError), ev.createdAt ?? ""].join(
          ","
        )
      );
    }

    // Missing-collection events
    for (const ev of noCollectionEvents) {
      csvRows.push(
        [csvEscape(ev.eventUuid), csvEscape(ev.Title), ev.activityId, "NO_COLLECTION_IN_API", ev.createdAt ?? ""].join(",")
      );
    }

    const csvContent = csvRows.join("\n");

    await sendLogNotificationWithCsv({
      message: finalMessage,
      topic: "system",
      csvFileName: "MissingSBTCollectionEvents.csv",
      csvContent,
    });
  } else {
    // No errors or missing addresses: just send a basic text message
    logger.log(`there are no missing or error events`);
    // or sendLogNotification({ message: finalMessage, topic: "system" });
  }

  return;
};
