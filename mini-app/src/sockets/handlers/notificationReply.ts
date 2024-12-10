// handleNotificationReply.ts
import { z } from "zod";
import { notificationsDB } from "@/server/db/notifications.db";
import { NotificationStatus, NotificationType, NotificationItemType } from "@/db/schema"; // Ensure enums are correctly imported
import { eventPoaResultsDB } from "@/server/db/eventPoaResults.db";
import { eventPoaTriggersDB } from "@/server/db/eventPoaTriggers.db";
import { NOTIFICATION_TIMEOUT_MARGIN } from "@/sockets/constants";
import { validateNotificationReply } from "@/sockets/helpers/validateNotificationReply";
import { getEventById } from "@/server/db/events";

type CallbackFunction = (response: { status: string; message: string }) => void;

export const handleNotificationReply = async (
  data: any,
  callback: CallbackFunction,
  sanitizedUsername: string,
  userId: number, // userId of current user
) => {
  try {
    // Validate input
    const validatedData = validateNotificationReply(data);

    if (!validatedData.valid) {
      callback({ status: "error", message: "Invalid input for handleNotificationReply" });
      return;
    }

    // Destructure notificationId and answer directly
    const { notificationId, answer } = validatedData;
    const notificationIdNumber = Number(notificationId);
    console.log(
      `Received notification_reply from ${sanitizedUsername}: notificationId=${notificationId}, answer=${answer}`,
    );
    if (isNaN(notificationIdNumber)) {
      callback({ status: "error", message: "Invalid notification ID" });
      return;
    }
    // Fetch the notification by ID using the notificationsDB helper
    const foundNotification = await notificationsDB.getNotificationById(notificationIdNumber);
    const currentTime = Math.floor(Date.now() / 1000);


    // Check if the notification was found
    if (!foundNotification) {
      callback({ status: "error", message: "Notification not found" });
      console.warn(`Notification ${notificationIdNumber} not found.`);
      return;
    }
    const foundNotificationUserId = Number(foundNotification.userId);
    // Check if the foundNotificationUserId is a valid number
    if (isNaN(foundNotificationUserId)) {
      callback({ status: "error", message: "Invalid notification owner" });
      console.warn(`Notification ${notificationIdNumber} has invalid owner.`);
      return;
    }

    // Check ownership
    if (foundNotificationUserId !== userId) {
      console.warn(
        `User ${sanitizedUsername} (ID: ${userId}) attempted to reply to a notification they don't own (Notification ID: ${notificationIdNumber}).`,
      );
      callback({
        status: "error",
        message: "Unauthorized: You do not own this notification.",
      });
      return;
    }

    // Check if the notification is unread and suspected to be bot
    if (foundNotification.readAt === null) {
      console.warn(
        `User ${sanitizedUsername} (ID: ${userId}) attempted to reply to an unread notification (Notification ID: ${notificationIdNumber}).`,
      );
      callback({
        status: "error",
        message: `You can't reply to an unread notification.`,
      });
      return;
    }

    // Check if the notification is expired
    const readAtTimestamp = Math.floor(new Date(foundNotification.readAt).getTime() / 1000);
    const timeoutToCheck = foundNotification.actionTimeout ? Number(foundNotification.actionTimeout) : 0;
    const notificationTimeout = readAtTimestamp + timeoutToCheck + NOTIFICATION_TIMEOUT_MARGIN;
    console.log(`readAtTimestamp: ${readAtTimestamp}, foundNotification.actionTimeout: ${foundNotification.actionTimeout}, currentTime: ${currentTime}, notificationTimeout: ${notificationTimeout}`);
    if (notificationTimeout < currentTime) {
      console.warn(
        `User ${sanitizedUsername} (ID: ${userId}) attempted to reply to a notification after timeout (Notification ID: ${notificationIdNumber}).`,
      );
      callback({
        status: "error",
        message: `You can't reply to this notification after the timeout.`,
      });
      return;
    }

    // User is authorized, update the notification
    const newStatus: NotificationStatus = "REPLIED";
    const actionReply = { answer };
    console.log(`Updating notification ${notificationIdNumber} status to ${newStatus} with reply:`, actionReply);
    // Update the notification status and reply
    await notificationsDB.updateNotificationStatusAndReply(notificationIdNumber, newStatus, actionReply);

    if (foundNotification.item_type === "POA_TRIGGER") {
      // If the notification is for a POA trigger, insert a new POA result
      const eventPoaTrigger = await eventPoaTriggersDB.getEventPoaTriggerById(foundNotification.itemId);
      if (!eventPoaTrigger) {
        console.warn(`Event POA Trigger not found for ID ${foundNotification.itemId}`);
      } else {
        console.log(`Inserting POA result for User ${userId} and Event ${eventPoaTrigger.eventId}`);
        await eventPoaResultsDB.insertPoaResult({
          userId,
          eventId: eventPoaTrigger.eventId,
          poaId: foundNotification.itemId,
          poaAnswer: answer,
          status: "REPLIED",
          repliedAt: new Date(),
          notificationId: notificationIdNumber,
        });
        const eventId =  eventPoaTrigger.eventId;
        const eventDetails = await getEventById(eventId);
        // Emit a USER_ANSWER_POA notification to the organizer
        const organizerId = eventDetails?.owner;
        if (!organizerId) {
          console.warn(`Organizer ID not found for Event POA Trigger ID ${eventPoaTrigger.id}`);
        } else {
          const userAnswerNotification = {
            userId: organizerId,
            type: "USER_ANSWER_POA" as NotificationType,
            title: `User ${userId} has responded to your POA`,
            desc: `User with ID ${userId} has replied with '${answer}' to your POA for Event ID ${eventPoaTrigger.eventId}.`,
            actionTimeout: 0,
            additionalData: { participant_id: userId, event_id: eventPoaTrigger.eventId, poa_id: foundNotification.itemId },
            priority: 2,
            itemId: foundNotification.itemId,
            item_type: "POA_TRIGGER" as NotificationItemType,
            status: "WAITING_TO_SEND" as NotificationStatus,
            createdAt: new Date(),

            expiresAt: new Date(Date.now() + 60 * 60 * 24 * 30 * 1000), // 30 days from now
          };

          await notificationsDB.addNotification(userAnswerNotification);
          console.log(`USER_ANSWER_POA notification created for Organizer ID ${organizerId}`);
        }
      }
    }

    if (callback) {
      callback({
        status: "success",
        message: `Notification ${notificationIdNumber} reply '${answer}' processed successfully`,
      });
    }
  } catch (error) {
    console.error("Error processing notification_reply:", error);

    let errorMessage = "An unexpected error occurred.";
    if (error instanceof z.ZodError && error.errors.length > 0) {
      errorMessage = error.errors[0].message;
    }

    if (callback) {
      callback({
        status: "error",
        message: errorMessage,
      });
    }
  }
};
