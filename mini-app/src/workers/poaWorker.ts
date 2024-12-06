import { db } from "@/db/db";
import { eventPoaTriggersDB } from "@/server/db/eventPoaTriggers";
import { notificationsDB } from "@/server/db/notifications";
import { eventRegistrants } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getEventsWithFilters } from "@/server/db/events";
import searchEventsInputZod from "@/zodSchema/searchEventsInputZod";
import { formatDateTime } from "@/lib/DateAndTime";
import { z } from "zod";

const WORKER_INTERVAL = 10 * 1000; // 1 minute


// Function to fetch ongoing events with online participation
const fetchOngoingEvents = async () => {
  const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds

  // Ensure the params conform to the Zod schema
  const params: z.infer<typeof searchEventsInputZod> = {
    search: "",
    filter: {
      participationType: ["online"],
      startDate: currentTime,
      startDateOperator: "<=",
      endDate: currentTime,
      endDateOperator: ">=",
    },
    sortBy: "start_date_asc",
    limit: 100,
    offset: 0,
    useCache: false,
  };

  // Call the function with type-safe arguments
  return getEventsWithFilters(params);
};

// Worker Function
const processOngoingEvents = async () => {
  console.log("===================================");
  console.log("POA Worker(👙) started at:", new Date().toISOString());

  try {
    const ongoingEvents = await fetchOngoingEvents();
    console.log(`Fetched ${ongoingEvents.length} ongoing events.`);
    // Extract the required fields for the table
    const filteredEvents = ongoingEvents.map(({
                                                title,
                                                eventId,
                                                eventUuid,
                                                startDate,
                                                endDate,
                                              }) => ({
      title,
      eventId,
      eventUuid,
      startDate: formatDateTime(startDate),
      endDate: formatDateTime(endDate),
    }));

// Display the filtered events in a table format
    console.table(filteredEvents);

    for (const event of ongoingEvents) {
      if (!event?.eventId) {
        console.warn("Invalid event data:", event);
        continue;
      }
      const eventId = event.eventId;
      const eventUuid = event.eventUuid;
      console.log("--------------------------------------------------");
      console.log(`Processing Event ${eventId} - ${eventUuid}: ${event.title} to send POA notifications`);

      try {
        // Fetch active POA triggers where the trigger time has passed
        const activePoaTriggers = await eventPoaTriggersDB.getActivePoaForEventByTime(
          eventId,
          0,
          Date.now(),
        );

        if (activePoaTriggers.length === 0) {
          console.warn(`No active POA triggers for Event ${eventId} - ${eventUuid} - ${event.title}`);
          continue; // Skip if no active triggers
        }
        console.log(`Active POA Triggers for Event ${eventId} - ${eventUuid} - ${event.title}:`);
        console.table(activePoaTriggers);
        // Fetch approved users for the event
        // @todo: Add a limit to the number of users fetched also fetch only users has not been sent the notification
        const approvedUsers = await db
          .select({ userId: eventRegistrants.user_id })
          .from(eventRegistrants)
          .where(
            and(
              eq(eventRegistrants.event_uuid, eventUuid),
              eq(eventRegistrants.status, "approved"),
            ),
          )
          .execute();
        if (approvedUsers.length === 0) {
          console.warn(`No approved users for Event ${eventId} `);
          continue; // Skip if no approved users
        }
        console.log(`Cont of Approved Users for Event ${eventId}  :`, approvedUsers.length);

        for (const trigger of activePoaTriggers) {
          try {
            for (const user of approvedUsers) {
              if (!user?.userId) {
                console.warn(`Skipped invalid user for Event ${eventId} and Trigger ${trigger.id}`);
                continue;
              }
              try {
                const notification = {
                  userId: user.userId,
                  type: "POA_SIMPLE" as const,
                  title: `${event.title}`,
                  desc: "Please confirm your presence.",
                  actionTimeout: 20, // 1 minute
                  additionalData: {
                    eventId: eventId,
                    poaId: trigger.id,
                  },
                  priority: 1,
                  itemId: trigger.id,
                  item_type: "POA_TRIGGER" as const,
                  status: "WAITING_TO_SEND" as const,
                  createdAt: new Date(),
                  expiresAt: new Date(Date.now() + 60 * 60 * 24 * 30 * 1000), // 1 month
                };

                await notificationsDB.addNotification(notification);

                console.log(
                  `Created notification for POA Trigger ${trigger.id} of Event ${eventId} - ${eventUuid} for User ${user.userId}`,
                );

              } catch (notificationError) {
                console.error(
                  `Failed to create notification for User ${user.userId} in Event ${eventId} - ${eventUuid}  for Trigger ${trigger.id}:`,
                  notificationError,
                );
              }
            }

            console.log(
              `Completed notifications for POA Trigger ${trigger.id} of Event ${eventId} - ${eventUuid} `,
            );
          } catch (triggerError) {
            console.error(
              `Error processing Trigger ${trigger.id} for Event ${eventId}:`,
              triggerError,
            );
          }
        }
      } catch (eventError) {
        console.error(`Error processing Event ${eventId}:`, eventError);
      }
    }
  } catch (error) {
    console.error("Error fetching ongoing events:", error);
  }

  console.log("Worker finished processing at:", new Date().toISOString());
};


// Worker Loop
const runWorker = async () => {
  while (true) {
    try {
      await processOngoingEvents();
    } catch (error) {
      console.error("!!!!! Unhandled error in POA Worker:", error);
    }
    console.log(`Waiting for ${WORKER_INTERVAL / 1000} seconds before the next run...`);
    await new Promise((resolve) => setTimeout(resolve, WORKER_INTERVAL));
  }
};

// Start the Worker
runWorker();
