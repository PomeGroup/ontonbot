import { db } from "@/db/db";
import { eventPoaTriggersDB } from "@/server/db/eventPoaTriggers";
import { notificationsDB } from "@/server/db/notifications";
import { eventRegistrants } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getEventsWithFilters } from "@/server/db/events";
import searchEventsInputZod from "@/zodSchema/searchEventsInputZod";
import { z } from "zod";

const WORKER_INTERVAL = 1 * 1000; // 1 minute

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
    useCache: false,
  };

  // Call the function with type-safe arguments
  return getEventsWithFilters(params);
};

// Worker Function
const processOngoingEvents = async () => {
  console.log("Worker started at:", new Date().toISOString());

  try {
    const ongoingEvents = await fetchOngoingEvents();
    console.log(`Fetched ${ongoingEvents.length} ongoing events.`);

    for (const event of ongoingEvents) {
      if (!event?.eventId) {
        console.warn("Invalid event data:", event);
        continue;
      }
      const eventId = event.eventId;
      const eventUuid = event.eventUuid;

      console.log(`Processing Event ${eventId} - ${eventUuid}: ${event.title} to send POA notifications`);

      try {
        // Fetch active POA triggers where the trigger time has passed
        const activePoaTriggers = await eventPoaTriggersDB.getActivePoaForEventByTime(
          eventId,
          0,
          Date.now(),
        );
        console.log(`Active POA Triggers for Event ${eventId} - ${eventUuid}:`, activePoaTriggers);
        if (activePoaTriggers.length === 0) {
          console.warn(`No active POA triggers for Event ${eventId} - ${eventUuid}`);
          continue; // Skip if no active triggers
        }
        // Fetch approved users for the event
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
          console.warn(`No approved users for Event ${eventId} - ${eventUuid}`);
          continue; // Skip if no approved users
        }
        console.log(`Approved Users for Event ${eventId} - ${eventUuid} :`, approvedUsers.length);

        for (const trigger of activePoaTriggers) {
          try {
            for (const user of approvedUsers) {
              if (!user?.userId) {
                console.warn(`Skipped invalid user for Event ${eventId} ${eventUuid} and Trigger ${trigger.id}`);
                continue;
              }
              try {
                const notification = {
                  userId: user.userId,
                  type: "POA_SIMPLE" as const,
                  title: `Participation Approval Required for Event:  ${event.title}`,
                  desc: "Please approve your participation in the event.",
                  actionTimeout: 60, // 1 minute
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


processOngoingEvents();

// Worker Interval
// setInterval(async () => {
//   await processOngoingEvents();
// }, WORKER_INTERVAL);
