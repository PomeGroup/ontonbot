import { eventPoaTriggersDB } from "@/server/db/eventPoaTriggers.db";
import { notificationsDB } from "@/server/db/notifications.db";
import { EventTriggerStatus, NotificationItemType, NotificationStatus, NotificationType } from "@/db/schema";
import { getEventsWithFilters, getEventById } from "@/server/db/events";
import searchEventsInputZod from "@/zodSchema/searchEventsInputZod";
import { z } from "zod";
import { fetchApprovedUsers } from "@/server/db/eventRegistrants.db";
import { ACTION_TIMEOUTS, PASSWORD_RETRY_LIMIT} from "@/sockets/constants";

const WORKER_INTERVAL = 5 * 1000; // 5 seconds
const PAGE_SIZE = 500; // Number of users to fetch per batch

let isShuttingDown = false;

// Listen for shutdown signals
process.on('SIGINT', () => {
  console.log('Received SIGINT. Initiating graceful shutdown...');
  isShuttingDown = true;
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM. Initiating graceful shutdown...');
  isShuttingDown = true;
});

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

// Function to create a notification for the event owner
const notifyEventOwner = async (eventId: number, ownerId: number, notificationCount: number , triggerId : number) => {
  const notification = {
    userId: ownerId,
    type: "POA_CREATION_FOR_ORGANIZER" as NotificationType, // Define a suitable notification type
    title: `All notifications created for Event ID ${eventId}`,
    desc: `A total of ${notificationCount} notifications have been created.`,
    actionTimeout: 0,
    additionalData: { owner_id : ownerId , event_id : eventId , notification_count : notificationCount },
    priority: 2,
    itemId: triggerId,
    item_type: "POA_TRIGGER" as NotificationItemType,
    status: "WAITING_TO_SEND" as NotificationStatus,
    createdAt: new Date(),
    readAt: undefined,
    expiresAt: new Date(Date.now() + 60 * 60 * 24 * 30 * 1000), // 30 days from now
  };
  console.log(`Creating notification for Event ${eventId} to Owner ${ownerId}: Count = ${notificationCount}`);
  try {
    await notificationsDB.addNotifications([notification], false);
    console.log(`Created notification for Event ${eventId} to Owner ${ownerId}: Count = ${notificationCount}`);
  } catch (error) {
    console.error(`Failed to create notification for Event Owner ${ownerId}:`, error);
  }
};

// Worker Function
const processOngoingEvents = async () => {
  console.log("===================================");
  console.log("POA Worker started at:", new Date().toISOString());

  try {
    const ongoingEvents = await fetchOngoingEvents();
    console.log(`Fetched ${ongoingEvents.length} ongoing events.`);

    for (const event of ongoingEvents) {
      if (!event?.eventId || !event?.eventUuid) {
        console.warn("Invalid event data:", event);
        continue;
      }
      const eventId = event.eventId;
      const eventUuid = event.eventUuid;
      const eventTitle = event.title;
      let totalNotificationsCreated = 0; // Initialize counter for the event

      try {
        const startTime = Math.floor(Date.now() / 1000);
        const readableDate = new Date(startTime * 1000).toLocaleString();
        console.log(`Processing Event ${eventId} : ${eventTitle} at ${startTime} - ${readableDate}`);
        const activePoaTriggers = await eventPoaTriggersDB.getActivePoaForEventByTime(
          eventId,
          startTime
        );

        if (activePoaTriggers.length === 0) {
          console.warn(`No active POA triggers for Event ${eventId} at ${startTime}`);
          continue;
        }

        for (const trigger of activePoaTriggers) {
          let lastUserId = 0;
          let hasMore = true;

          while (hasMore) {
            // Check for shutdown during batch processing
            if (isShuttingDown) {
              console.log('Shutdown requested during user processing. Exiting batch...');
              return;
            }
            const approvedUsers = await fetchApprovedUsers(
              eventUuid,
              trigger.id,
              lastUserId,
              PAGE_SIZE
            );

            if (approvedUsers.length === 0) {
              hasMore = false;
              break;
            }
            let finalUsers = approvedUsers; // default: no filtering

            if (trigger.poaType === "password") {
              const userIds = approvedUsers.map((u) => u.userId);

              // Now we fetch REPLIED notifications for these users & event
              const replied = await notificationsDB.getRepliedPoaPasswordNotificationsForEvent(eventId, userIds);
              console.log(`Found ${replied.length} replied password notifications for Event ${eventId}`, replied);

              // Convert userId to number if needed
              const userIdsWhoAlreadyReplied = new Set(replied.map((n: any) => parseInt(n.userId, 10)));

              // Filter out the users who have REPLIED (so we don't send them new notifications)
              finalUsers = approvedUsers.filter((u) => !userIdsWhoAlreadyReplied.has(u.userId));
              console.log(
                `Filtered out ${approvedUsers.length - finalUsers.length} users who already replied`,
                finalUsers
              );
            }
            const notificationsToAdd = finalUsers.map((user) => ({
              userId: user.userId,
              type: trigger.poaType === "simple" ? "POA_SIMPLE" : ("POA_PASSWORD" as NotificationType),
              title: event.title,
              desc:
                trigger.poaType === "simple"
                  ? `Please respond to the POA for Event ${event.title}`
                  : `Please enter the password for Event ${event.title}`,
              actionTimeout:
                trigger.poaType === "simple"
                  ? ACTION_TIMEOUTS.POA_SIMPLE
                  : ACTION_TIMEOUTS.POA_PASSWORD,
              additionalData: { eventId, poaId: trigger.id, maxTry: PASSWORD_RETRY_LIMIT },
              priority: 1,
              itemId: trigger.id,
              item_type: "POA_TRIGGER" as NotificationItemType,
              status: "WAITING_TO_SEND" as NotificationStatus,
              createdAt: new Date(),
              readAt: undefined,
              expiresAt: new Date(Date.now() + 60 * 60 * 24 * 30 * 1000),
            }));

            try {
              const result = await notificationsDB.addNotifications(notificationsToAdd);
              console.log(`Created ${result.count} notifications for Trigger ${trigger.id}`);
              totalNotificationsCreated += result.count; // Accumulate count
            } catch (notificationError) {
              console.error(`Failed to create notifications:`, notificationError);
            }
            lastUserId = approvedUsers[approvedUsers.length - 1].userId;
            if (approvedUsers.length < PAGE_SIZE) hasMore = false;
          }

          try {
            await eventPoaTriggersDB.updateEventPoaStatus(trigger.id, "completed" as EventTriggerStatus);
            console.log(`Completed notifications for POA Trigger ${trigger.id}`);
            // After processing all triggers for the event, notify the event owner
            const eventDetails = await getEventById(eventId);
            if (!eventDetails || !eventDetails.owner) {
              console.warn(`Event details or owner data not found for Event ID ${eventId}`);
            } else {
              const ownerId = eventDetails.owner;
              await notifyEventOwner(eventId, ownerId, totalNotificationsCreated,trigger.id);
            }
          } catch (statusUpdateError) {
            console.error(`Failed to update status for POA Trigger ${trigger.id}:`, statusUpdateError);
          }

          // Check for shutdown after completing a trigger
          if (isShuttingDown) {
            console.log('Shutdown requested after trigger processing. Exiting...');
            return;
          }
        }



      } catch (eventError) {
        console.error(`Error processing Event ${eventId}:`, eventError);
      }

      // Check for shutdown after processing an event
      if (isShuttingDown) {
        console.log('Shutdown requested after event processing. Exiting...');
        return;
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
    if (isShuttingDown) {
      console.log('Shutdown flag detected. Exiting worker loop...');
      break;
    }

    try {
      await processOngoingEvents();
    } catch (error) {
      console.error("!!!!! Unhandled error in POA Worker:", error);
    }

    if (isShuttingDown) {
      console.log('Shutdown flag detected after processing. Exiting worker loop...');
      break;
    }

    console.log(
      `Waiting for ${WORKER_INTERVAL / 1000} seconds before the next run...`
    );
    await new Promise((resolve) => setTimeout(resolve, WORKER_INTERVAL));
  }

  // After exiting the loop, perform any additional shutdown tasks if necessary
  await shutdown();
};

// Shutdown Function to Clean Up Resources
const shutdown = async () => {
  console.log('Shutting down resources...');

  const shutdownTimeout = setTimeout(() => {
    console.warn('Shutdown timeout reached. Forcing exit.');
    process.exit(1);
  }, 10000); // 10 seconds timeout
  // Add any additional cleanup tasks here
  clearTimeout(shutdownTimeout);
  console.log('Shutdown complete. Exiting process.');
  process.exit(0);
};

// Start the Worker
runWorker().catch((error) => {
  console.error("!!!!! Unhandled error in POA Worker:", error);
  process.exit(1);
});
