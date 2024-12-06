// handleNotificationReply.ts
import { notificationReplySchema } from "@/zodSchema/SocketZodSchemas";
import { z } from "zod";
import { notificationsDB } from "@/server/db/notifications.db";
import { NotificationStatus } from "@/db/schema";

type CallbackFunction = (response: { status: string; message: string }) => void;

export const handleNotificationReply = async (
  data: any,
  callback: CallbackFunction,
  sanitizedUsername: string,
  userId: number // userId of current user
) => {
  try {
    // Validate input
    const validatedData = notificationReplySchema.parse(data);
    const { notificationId, answer } = validatedData;

    console.log(
      `Received notification_reply from ${sanitizedUsername}: notificationId=${notificationId}, answer=${answer}`
    );

    const notifIdNum =   Number(notificationId);
    if (isNaN(notifIdNum)) {
      callback({ status: "error", message: "Invalid notification ID" });
    }
    // Fetch the notification by ID using the notificationsDB helper
    const foundNotification = await notificationsDB.getNotificationById(notifIdNum);

    if (!foundNotification) {
      if (callback) {
        callback({ status: "error", message: "Notification not found" });
      }
      console.warn(`Notification ${notificationId} not found.`);
      return;
    }
    const foundNotificationUserId = Number(foundNotification.userId);
    if (isNaN(foundNotificationUserId)) {
      if (callback) {
        callback({ status: "error", message: "Invalid notification owner" });
      }
      console.warn(`Notification ${notificationId} has invalid owner.`);
      return;
    }
    // Check ownership

    if (foundNotificationUserId !== userId) {
      console.warn(
        `User ${sanitizedUsername} (ID: ${userId}) attempted to reply to a notification they don't own (Notification ID: ${notificationId}).`
      );
      if (callback) {
        callback({
          status: "error",
          message: "Unauthorized: You do not own this notification.",
        });
      }
      return;
    }

    // User is authorized, update the notification
    // Use the NotificationStatus type defined from the enum
    const newStatus: NotificationStatus = "REPLIED";
    const actionReply = { answer };
    console.log(`Updating notification ${notificationId} status to ${newStatus} with reply:`, actionReply);
    await notificationsDB.updateNotificationStatusAndReply(notifIdNum, newStatus, actionReply);

    if (callback) {
      callback({
        status: "success",
        message: `Notification ${notificationId} reply '${answer}' processed successfully`,
      });
    }
  } catch (error) {
    console.error("Error processing notification_reply:", error);

    let errorMessage = "Invalid input";
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
