import { db } from "@/db/db";
import { NotificationItemType, notifications, NotificationStatus, NotificationType } from "@/db/schema";
import { redisTools } from "@/lib/redisTools";
import { and, eq, lt } from "drizzle-orm";
import { QueueNames } from "@/sockets/constants";
import { rabbitMQService } from "@/server/routers/services/rabbitMQService";

/**
 * Represents the shape of notification data required for insertion.
 */
type NotificationData = {
  userId: number;
  type: NotificationType;
  title?: string;
  desc?: string;
  priority?: number;
  icon?: string;
  image?: string;
  link?: string;
  actionTimeout?: number;
  actionReply?: object;
  additionalData?: object;
  status?: NotificationStatus; // Default: "WAITING_TO_SEND"
  createdAt?: Date;
  readAt?: Date;
  expiresAt?: Date;
  itemId?: number;
  item_type?: NotificationItemType;
};

// Cache key generator for notifications
const getNotificationCacheKey = (notificationId: number) => `${redisTools.cacheKeys.notification}${notificationId}`;

// Add a new notification
export const addNotification = async (notificationData: {
  userId: number;
  type: NotificationType;
  title?: string;
  desc?: string;
  priority?: number;
  icon?: string;
  image?: string;
  link?: string;
  actionTimeout?: number;
  actionReply?: object;
  additionalData?: object;
  status?: NotificationStatus; // Default: "WAITING_TO_SEND"
  createdAt?: Date;
  readAt?: Date;
  expiresAt?: Date;
  itemId?: number;
  item_type?: NotificationItemType;
}) => {
  try {
    const result = await db
      .insert(notifications)
      .values({
        userId: notificationData.userId,
        type: notificationData.type,
        title: notificationData.title,
        desc: notificationData.desc,
        priority: notificationData.priority || 1,
        icon: notificationData.icon || null,
        image: notificationData.image || null,
        link: notificationData.link || null,
        actionTimeout: notificationData.actionTimeout,
        actionReply: null,
        additionalData: notificationData.additionalData,
        status: notificationData.status || "WAITING_TO_SEND",
        createdAt: notificationData.createdAt || new Date(),
        readAt: notificationData.readAt || null,
        expiresAt: notificationData.expiresAt,
        itemId: notificationData.itemId,
        item_type: notificationData.item_type || "UNKNOWN",
      })
      .onConflictDoNothing()
      .returning({ id: notifications.id }) // Return the ID of the inserted row
      .execute();

    // Check if the result is empty, indicating the record already existed
    if (result.length === 0) {
      console.log("Notification already exists.");
      return { success: false, message: "Record already exists." };
    }
    // add to rabbitMQ
    const notificationId = result[0].id;

    // Push the notification to RabbitMQ
    const message = {
      notificationId,
      ...notificationData,
    };

    await rabbitMQService.pushMessageToQueue(QueueNames.NOTIFICATIONS, message);
    console.log(`Notification added for User ${notificationData.userId} with ID ${notificationId} and type ${notificationData.type}`);
    return { success: true, notificationId: result[0].id }; // Return the ID of the inserted notification
  } catch (error) {
    console.error("Error adding notification:", error);
    throw error;
  }
};

// Get notifications by status
export const getNotificationsByStatusAndItemId = async (itemId: number, status: NotificationStatus) => {
  try {

    const result = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.itemId, itemId),
          eq(notifications.status, status)
        )
      )
      .execute();

    console.log(`Notifications with status "${status}" retrieved:`, result);
    return result;
  } catch (error) {
    console.error("Error getting notifications by status:", error);
    throw error;
  }
};

// Update notification status
export const updateNotificationStatus = async (notificationId: number, newStatus: NotificationStatus) => {
  try {
    await db
      .update(notifications)
      .set({ status: newStatus })
      .where(eq(notifications.id, notificationId))
      .execute();

    await redisTools.deleteCache(getNotificationCacheKey(notificationId)); // Clear cache
    console.log(`Notification ${notificationId} status updated to ${newStatus}`);
  } catch (error) {
    console.error("Error updating notification status:", error);
    throw error;
  }
};

// Update notification status and action reply
export const updateNotificationStatusAndReply = async (
  notificationId: number,
  newStatus: NotificationStatus,
  actionReply: object,
) => {
  try {
    await db
      .update(notifications)
      .set({ status: newStatus, actionReply: actionReply })
      .where(eq(notifications.id, notificationId))
      .execute();

    await redisTools.deleteCache(getNotificationCacheKey(notificationId)); // Clear cache
    console.log(`Notification ${notificationId} status updated to ${newStatus} with action reply`);
  } catch (error) {
    console.error("Error updating notification status and reply:", error);
    throw error;
  }
};

// Delete notifications with expiration date less than a specific date
export const deleteNotificationsByExpiry = async (expiryDate: Date) => {
  try {
    const result = await db
      .delete(notifications)
      .where(lt(notifications.expiresAt, expiryDate))
      .execute();

    console.log(`Deleted notifications with expiry date less than ${expiryDate}:`, result);
    return result;
  } catch (error) {
    console.error("Error deleting expired notifications:", error);
    throw error;
  }
};


export const getNotificationById = async (notificationId: number) => {
  try {
    const foundNotifications = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, notificationId))
      .limit(1)
      .execute();

    return foundNotifications.length > 0 ? foundNotifications[0] : null;
  } catch (error) {
    console.error("Error getting notification by ID:", error);
    throw error;
  }
};


export const addNotifications = async (
  notificationsToAdd: NotificationData[]
): Promise<{ success: boolean; count: number }> => {
  try {
    // Prepare data for bulk insert, ensuring all required fields are present
    const insertValues = notificationsToAdd.map((notification) => ({
      userId: notification.userId,
      type: notification.type,
      title: notification.title ?? null,
      desc: notification.desc ?? null,
      priority: notification.priority ?? 1,
      icon: notification.icon ?? null,
      image: notification.image ?? null,
      link: notification.link ?? null,
      actionTimeout: notification.actionTimeout ?? undefined, // Convert null to undefined
      actionReply: notification.actionReply ?? null,
      additionalData: notification.additionalData ?? null,
      status: notification.status ?? "WAITING_TO_SEND",
      createdAt: notification.createdAt ?? new Date(),
      readAt: notification.readAt ?? null,
      expiresAt: notification.expiresAt ?? null,
      itemId: notification.itemId ?? undefined, // Convert null to undefined
      item_type: notification.item_type ?? "UNKNOWN",
    }));

    // Bulk insert notifications and retrieve inserted records
    const insertedNotifications = await db
      .insert(notifications)
      .values(insertValues)
      .returning({
        id: notifications.id,
        userId: notifications.userId,
        type: notifications.type,
        title: notifications.title,
        desc: notifications.desc,
        priority: notifications.priority,
        icon: notifications.icon,
        image: notifications.image,
        link: notifications.link,
        actionTimeout: notifications.actionTimeout,
        additionalData: notifications.additionalData,
        status: notifications.status,
        createdAt: notifications.createdAt,
        readAt: notifications.readAt,
        expiresAt: notifications.expiresAt,
        itemId: notifications.itemId,
        item_type: notifications.item_type,
      })
      .execute();

    console.log(`Added ${insertedNotifications.length} notifications.`);

    // Prepare RabbitMQ messages with full notification data
    const rabbitMQMessages = insertedNotifications.map((notification) => ({
      notificationId: notification.id,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      desc: notification.desc,
      priority: notification.priority,
      icon: notification.icon,
      image: notification.image,
      link: notification.link,
      actionTimeout: notification.actionTimeout,
      additionalData: notification.additionalData,
      status: notification.status,
      createdAt: notification.createdAt,
      readAt: notification.readAt,
      expiresAt: notification.expiresAt,
      itemId: notification.itemId,
      item_type: notification.item_type,
    }));

    // Enqueue all messages to RabbitMQ in parallel
    const enqueuePromises = rabbitMQMessages.map(async (message) => {
      try {
        await rabbitMQService.pushMessageToQueue(QueueNames.NOTIFICATIONS, message);
        console.log(
          `Notification ID ${message.notificationId} enqueued to RabbitMQ successfully.`
        );
      } catch (mqError) {
        console.error(
          `Failed to enqueue Notification ID ${message.notificationId} to RabbitMQ:`,
          mqError
        );
        // Optionally, implement retry logic or mark the notification for retry
      }
    });

    // Wait for all enqueue operations to complete
    await Promise.all(enqueuePromises);

    return { success: true, count: insertedNotifications.length };
  } catch (error) {
    console.error("Error adding notifications:", error);
    throw error; // Propagate the error to be handled by the caller
  }
};

// Export all functions as a single object
export const notificationsDB = {
  addNotification,
  getNotificationsByStatusAndItemId,
  updateNotificationStatus,
  updateNotificationStatusAndReply,
  deleteNotificationsByExpiry,
  getNotificationById,
  addNotifications,
};
