import { create } from "zustand";
import { NotificationType, NotificationStatus, NotificationItemType } from "@/db/schema";
type Notification = {
  notificationId: string;
  userId: number;
  type: NotificationType;
  title: string;
  desc: string;
  actionTimeout: number;
  additionalData: {
    participant_id?: number;
    event_id?: number;
    poa_id?: string;
    notification_id?: number;
  };
  priority: number;
  itemId: string;
  item_type: NotificationItemType;
  status: NotificationStatus;
  createdAt: string;
  expiresAt: string;
  id: string; // appears to be the same as notificationId, but included for completeness
};

type NotificationState = {
  notifications: Notification[];
  addNotification: (notification: Notification) => void;
  clearNotifications: () => void;
};

const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  addNotification: (notification) =>
    set((state) => {
      // Check if this notificationId already exists
      const exists = state.notifications.some(
        (n) => n.notificationId === notification.notificationId
      );

      if (exists) {
        // If it already exists, don't add it again
        return { notifications: state.notifications };
      } else {
        // Otherwise, add the new notification
        return { notifications: [...state.notifications, notification] };
      }
    }),
  clearNotifications: () => set({ notifications: [] }),
}));

export default useNotificationStore;
