import { Server } from "socket.io";
import { Channel, Message } from "amqplib";
import { retryLimit, SocketEvents, UserId, userSockets } from "@/sockets/constants";
import { sanitizeInput } from "@/lib/sanitizer";
import { notificationsDB } from "@/server/db/notifications.db";
import { eventPoaTriggersDB } from "@/server/db/eventPoaTriggers.db";
import { eventPoaResultsDB } from "@/server/db/eventPoaResults.db";

export const emitNotification = async (
  io: Server,
  userId: UserId,// it must be number , if it was string and use casting them map will not work
  message: any,
  channel: Channel,
  msg: Message,
) => {

  const sockets = userSockets.get(Number(userId));
  console.log(`emitNotification - userId: ${userId}, type: ${typeof userId}`);
  // Extract notificationId and ensure it's a number
  const notificationIdNum = typeof message.notificationId === "string"
    ? parseInt(message.notificationId, 10)
    : message.notificationId;

  if (!sockets || sockets.size === 0) {
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
        console.log(eventPoaTrigger);
        console.log(`Inserting POA result for User ${userId} and Event ${eventPoaTrigger.eventId}`);
        await eventPoaResultsDB.insertPoaResult({
          userId,
          eventId: eventPoaTrigger.eventId,
          poaId: message.itemId,
          poaAnswer: "EXPIRED" ,
          status: "EXPIRED" ,
          repliedAt: new Date(),
          notificationId: message,
        });
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

  sockets.forEach((socketId) => {
    io.to(socketId).emit(SocketEvents.send.notification, sanitizedMessage);
    console.log(
      `Notification sent to User ${userId} via Socket ${socketId}: ${sanitizedMessage.notificationId} - ${sanitizedMessage.sanitizedMessage}`,
    );
  });

  // Since notification is successfully delivered, update its status to READ
  await notificationsDB.updateNotificationStatus(notificationIdNum, "READ");

  // Acknowledge successful message delivery
  channel.ack(msg);
};
