import { db } from "@/db/db";
import { notifications, NotificationStatus, NotificationType } from "@/db/schema";
import { redisTools } from "@/lib/redisTools";
import { eq, lt } from "drizzle-orm";

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
}) => {
  try {
    const result = await db
      .insert(notifications)
      .values({
        userId: notificationData.userId,
        type: notificationData.type,
        title: notificationData.title,
        desc: notificationData.desc,
        priority: notificationData.priority,
        icon: notificationData.icon,
        image: notificationData.image,
        link: notificationData.link,
        actionTimeout: notificationData.actionTimeout,
        actionReply: notificationData.actionReply,
        additionalData: notificationData.additionalData,
        status: notificationData.status || "WAITING_TO_SEND",
        createdAt: notificationData.createdAt || new Date(),
        readAt: notificationData.readAt,
        expiresAt: notificationData.expiresAt,
        itemId: notificationData.itemId,
      })
      .onConflictDoNothing()
      .execute();

    console.log("Notification added:", result);
    return result;
  } catch (error) {
    console.error("Error adding notification:", error);
    throw error;
  }
};

// Get notifications by status
export const getNotificationsByStatus = async (status: NotificationStatus) => {
  try {
    const cacheKey = `${redisTools.cacheKeys.notificationsByStatus}${status}`;
    const cachedResult = await redisTools.getCache(cacheKey);

    if (cachedResult) {
      return cachedResult; // Return cached data if available
    }

    const result = await db
      .select()
      .from(notifications)
      .where(eq(notifications.status, status))
      .execute();

    await redisTools.setCache(cacheKey, result, redisTools.cacheLvl.short); // Cache the result
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
  actionReply: object
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

// Export all functions as a single object
export const notificationsDB = {
  addNotification,
  getNotificationsByStatus,
  updateNotificationStatus,
  updateNotificationStatusAndReply,
  deleteNotificationsByExpiry,
};
