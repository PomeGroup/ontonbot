import { db } from "@/db/db";
import { events } from "@/db/schema/events";
import { eq, and, isNull, isNotNull, asc, not } from "drizzle-orm";

import eventDB from "@/server/db/events";
import { logger } from "@/server/utils/logger";
import { getFullActivityDetails } from "@/lib/ton-society-api"; // the method we discussed
import { sleep } from "@/utils";

// Optional: Adjust the chunk size to fit your needs
const BATCH_SIZE = 100;

/**
 * Finds events that have an activity_id but no sbt_collection_address,
 * fetches the full activity details from Ton Society,
 * and updates the event if we find a collection_address.
 */
export async function syncSbtCollectionsForEvents() {
  let totalUpdated = 0;
  let offset = 0;

  while (true) {
    // 1) Fetch a chunk of events missing sbt_collection_address
    const pendingEvents = await db
      .select({
        eventUuid: events.event_uuid,
        activityId: events.activity_id,
      })
      .from(events)
      .where(and(isNotNull(events.activity_id), not(eq(events.activity_id, -100)), isNull(events.sbt_collection_address)))
      .orderBy(asc(events.created_at))
      .limit(BATCH_SIZE)
      .offset(offset);

    if (pendingEvents.length === 0) {
      // no more events to process
      break;
    }
    offset += pendingEvents.length;

    // 2) Process each event in the chunk
    for (const evt of pendingEvents) {
      try {
        // Fetch the full details from Ton Society
        const activityResponse = await getFullActivityDetails(evt.activityId!);

        // Extract the collection_address if it exists
        const sbt_collection_address = activityResponse.data?.rewards?.collection_address;

        if (sbt_collection_address) {
          // 3) Update your DB record
          await db.update(events).set({ sbt_collection_address }).where(eq(events.activity_id, evt.activityId!)).execute();

          // 4) Clear the event cache
          await eventDB.deleteEventCache(evt.eventUuid);

          logger.info(`Updated event "${evt.eventUuid}" with sbt_collection_address: ${sbt_collection_address}`);
          totalUpdated++;
        } else {
          logger.info(`No sbt_collection_address in activity ${evt.activityId} for event "${evt.eventUuid}"`);
        }

        // Optional small delay to avoid spamming external API
        await sleep(50);
      } catch (error) {
        logger.error(`Failed to sync sbt_collection_address for event "${evt.eventUuid}"`, error);
      }
    }
  }

  return totalUpdated;
}
