import { z } from "zod";
import { notificationsDB } from "@/server/db/notifications.db";
import { NotificationStatus, NotificationType, NotificationItemType } from "@/db/schema";
import { eventPoaResultsDB } from "@/server/db/eventPoaResults.db";
import { eventPoaTriggersDB } from "@/server/db/eventPoaTriggers.db";
import { NOTIFICATION_TIMEOUT_MARGIN } from "@/sockets/constants";
import { validateNotificationReply } from "@/sockets/helpers/validateNotificationReply";
import { getEventById } from "@/server/db/events";
import { eventRegistrantsDB } from "@/server/db/eventRegistrants.db";
import eventFieldsDB from "@/server/db/eventFields.db";
import bcryptLib from "@/lib/bcrypt";
import userEventFieldsDB from "@/server/db/userEventFields.db";

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
    const { notificationId, answer, type } = validatedData;
    const notificationIdNumber = Number(notificationId);
    console.log(`Received notification_reply from ${sanitizedUsername}: notificationId=${notificationId}, answer=${answer} type=${type}`);
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
    console.log(
      `readAtTimestamp: ${readAtTimestamp}, foundNotification.actionTimeout: ${foundNotification.actionTimeout}, currentTime: ${currentTime}, notificationTimeout: ${notificationTimeout}`,
    );
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
    const relatedPOATrigger = await eventPoaTriggersDB.getEventPoaTriggerById(foundNotification.itemId);
    // Check if the related POA Trigger is found
    if (!relatedPOATrigger) {
      console.warn(`Event POA Trigger not found for ID ${foundNotification.itemId}`);
      callback({
        status: "error",
        message: `Event POA Trigger not found for ID ${foundNotification.itemId}`,
      });
      return;
    } else {
      console.log(`Found related POA Trigger:`, relatedPOATrigger);
    }
    const eventData = await getEventById(relatedPOATrigger.eventId);
    // Check if the related Event is found
    if (!eventData) {
      console.warn(`Event not found for ID ${relatedPOATrigger.eventId}`);
      callback({
        status: "error",
        message: `Event not found for ID ${relatedPOATrigger.eventId}`,
      });
      return;
    } else {
      console.log(`Found related Event:`, eventData);
    }
    const startDate = Number(eventData.start_date) * 1000;
    const endDate = Number(eventData.end_date) * 1000;
    // Check if the event is active
    if (Date.now() < startDate || Date.now() > endDate) {
      console.warn(
        `User ${sanitizedUsername} (ID: ${userId}) attempted to reply to a notification for an event that is not active (Notification ID: ${notificationIdNumber}).`,
      );
      callback({
        status: "error",
        message: `You can't reply to this notification for an event that is not active.`,
      });
    }
    const getRegisteredUser = await eventRegistrantsDB.getByEventUuidAndUserId(eventData.event_uuid, userId);
    if (!getRegisteredUser) {
      console.warn(
        `User ${sanitizedUsername} (ID: ${userId}) attempted to reply to a notification for an event they are not registered (Notification ID: ${notificationIdNumber}).`,
      );
      callback({
        status: "error",
        message: `You can't reply to this notification for an event you are not registered.`,
      });
      return;
    }

    if (foundNotification.type === "POA_PASSWORD") {
      const inputField = await eventFieldsDB.getEventFieldByTitleAndEventId("secret_phrase_onton_input", relatedPOATrigger.eventId);
      if (!inputField) {
        console.warn(`Event Field not found for ID ${relatedPOATrigger.eventId}`);
        callback({
          status: "error",
          message: `Event Field not found for ID ${relatedPOATrigger.eventId}`,
        });
        return;
      }
      // Generate the fixed password based on the current date
      const today = new Date();
      const dayOfMonth = today.getDate(); // Current day of the month
      const monthNameShort = today.toLocaleString("en-US", { month: "short" }); // Abbreviated month name
      // Fixed password format: <dayOfMonth>ShahKey@<monthNameShort>
      // [day_of_month]ShahKey@[month_name_short]
      const fixedPassword = `${dayOfMonth}ShahKey@${monthNameShort}`;

      // Compare the entered password against both the fixed password and the real password
      const enteredPassword = answer.trim().toLowerCase();

      const isFixedPasswordCorrect = enteredPassword === fixedPassword.toLowerCase();

      const isRealPasswordCorrect = eventData.secret_phrase ? await bcryptLib.comparePassword(enteredPassword, eventData.secret_phrase) : false;

      if (!isFixedPasswordCorrect && !isRealPasswordCorrect) {
        console.warn(
          `User ${sanitizedUsername} (ID: ${userId}) attempted to reply to a notification with wrong password (Notification ID: ${notificationIdNumber}).`,
        );
        callback({
          status: "password_error",
          message: "Password incorrect, try again",
        });
        return;
      }

      // Hash the entered password and store it
      const hashPassword = await bcryptLib.hashPassword(enteredPassword);

      await userEventFieldsDB.upsertUserEventFields(userId, relatedPOATrigger.eventId, inputField.id, hashPassword);
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
        const eventId = eventPoaTrigger.eventId;
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
            additionalData: {
              participant_id: userId,
              event_id: eventPoaTrigger.eventId,
              poa_id: foundNotification.itemId,
            },
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
