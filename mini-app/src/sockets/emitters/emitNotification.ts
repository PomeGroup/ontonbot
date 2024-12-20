import { Server } from "socket.io";
import { Channel, Message } from "amqplib";
import { retryLimit, SocketEvents, UserId, userSockets } from "@/sockets/constants";
import { sanitizeInput } from "@/lib/sanitizer";
import { notificationsDB } from "@/server/db/notifications.db";
import { eventPoaTriggersDB } from "@/server/db/eventPoaTriggers.db";
import { eventPoaResultsDB } from "@/server/db/eventPoaResults.db";
import { getEventById } from "@/server/db/events";
import { NotificationItemType, NotificationStatus, NotificationType } from "@/db/enum"; // Ensure this import is present

export const emitNotification = async (
  io: Server,
  userId: UserId, // it must be number, if it was string and use casting them map will not work
  message: any,
  channel: Channel,
  msg: Message,
) => {

  const roomName = `user_${userId}`;
  const room = io.sockets.adapter.rooms.get(roomName);
  console.log(`emitNotification - userId: ${userId}, type: ${typeof userId}`);

  // Extract notificationId and ensure it's a number
  const notificationIdNum = typeof message.notificationId === "string"
    ? parseInt(message.notificationId, 10)
    : message.notificationId;

  if (!room || room.size === 0) {
    console.warn(`User ${userId} is not online. Message will be retried.`);
    console.log(msg);

    // Check message retry count
    const deathHeader = (msg.properties.headers?.["x-death"] as Array<any>) || [];
    let retryCount = 0;

    if (deathHeader.length > 0) {
      retryCount = deathHeader.reduce(
        (total, death) => total + (death.count || 0),
        0,
      );
    } else {
      console.warn("x-death header not found. Assuming first attempt.");
    }

    if (retryCount >= retryLimit) {
      console.error(
        `Message dropped for User ${userId} after ${retryCount} retries:`,
      );
      // Update notification status to EXPIRED before acknowledging
      await notificationsDB.updateNotificationStatus(notificationIdNum, "EXPIRED");
      if (message.item_type === "POA_TRIGGER") {
        // If the notification is for a POA trigger, insert a new POA result
        const eventPoaTrigger = await eventPoaTriggersDB.getEventPoaTriggerById(message.itemId);
        if (eventPoaTrigger) {
          console.log(eventPoaTrigger);
          console.log(`Inserting POA result for User ${userId} and Event ${eventPoaTrigger.eventId}`);
          await eventPoaResultsDB.insertPoaResult({
            userId,
            eventId: eventPoaTrigger.eventId,
            poaId: message.itemId,
            poaAnswer: "NO",
            status: "EXPIRED",
            repliedAt: new Date(),
            notificationId: notificationIdNum,
          });
        } else {
          console.warn(`Event POA Trigger not found for ID ${message.itemId}`);
        }
      }
      channel.ack(msg); // Acknowledge the message, no further retries
      return;
    }

    // Send message to DLX to retry
    console.warn(`Sending message to DLX after ${retryCount} retries.`);
    channel.nack(msg, false, false); // requeue=false ensures message goes to DLX
    return;
  }

  // Emit notification to online users
  const sanitizedMessage = {
    ...message,
    id: `${message.notificationId}`,
    message: sanitizeInput(message.message),
  };

  io.to(roomName).emit(SocketEvents.send.notification, sanitizedMessage);
  console.log(`Notification sent to User ${userId} in room ${roomName}: ${sanitizedMessage.notificationId}`);


  try {
    // Since notification is successfully delivered, update its status to READ
    if(Number(notificationIdNum) > 0) {
      await notificationsDB.updateNotificationAsRead(notificationIdNum);
      console.log(`Notification ID ${notificationIdNum} marked as READ for User ${userId}`);
    }
    else
    {
      console.warn(`Notification ID ${notificationIdNum} is non-persist for User ${userId}`);
    }

  } catch (updateError) {
    console.error(`Failed to update notification status for Notification ID ${notificationIdNum}:`, updateError);
  }

  try {
    // After successfully sending the notification to the user,
    // create a USER_RECEIVED_POA notification for the organizer
    if (( message.type === "POA_SIMPLE" || message.type === "POA_PASSWORD") && message.additionalData && message.additionalData.eventId) {
      const eventId = message.additionalData.eventId;
      const eventDetails = await getEventById(eventId);

      if (!eventDetails || !eventDetails.owner) {
        console.warn(`Event details or owner not found for Event ID ${eventId}`);
      } else {
        const ownerId = eventDetails.owner;
        const organizerNotification = {
          userId: ownerId,
          type: "USER_RECEIVED_POA" as NotificationType,
          title: `User ${userId} has received a POA for Event ID ${eventId}`,
          desc: `User with ID ${userId} has successfully received a POA.`,
          actionTimeout: 0, // Adjust as needed
          additionalData: { participant_id : userId,event_id : eventId, notification_id: notificationIdNum },
          priority: 2, // Adjust priority as needed
          itemId: message.itemId,
          item_type: "POA_TRIGGER" as NotificationItemType,
          status: "WAITING_TO_SEND" as NotificationStatus,
          createdAt: new Date(),
          readAt: undefined,
          expiresAt: new Date(Date.now() + 60 * 60 * 24 * 30 * 1000), // 30 days from now
        };

        // Add the organizer notification to the database
        await notificationsDB.addNotifications([organizerNotification], false);
        console.log(`Created USER_RECEIVED_POA notification for Organizer ${ownerId} `);
      }
    }
  } catch (organizerNotificationError) {
    console.error(`Failed to create USER_RECEIVED_POA notification for Organizer:`, organizerNotificationError);
  }

  // Acknowledge successful message delivery
  channel.ack(msg);
};
