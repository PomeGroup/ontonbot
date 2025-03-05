import {
  json,
  pgTable,
  serial,
  smallint,
  timestamp,
  varchar,
  index,
  bigint,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { notificationStatus, notificationType, notificationItemType } from "@/db/enum";

export const notifications = pgTable(
  "notifications",
  {
    id: serial("id").primaryKey(),
    userId: bigint("user_id", { mode: "number" }).notNull(),
    type: notificationType("type").default("UNKNOWN"),
    title: varchar("title", { length: 255 }),
    desc: varchar("desc", { length: 255 }),
    priority: smallint("priority"),
    icon: varchar("icon", { length: 255 }),
    image: varchar("image", { length: 255 }),
    link: varchar("link", { length: 255 }),
    actionTimeout: serial("action_time_out"),
    actionReply: json("action_reply"),
    additionalData: json("additional_data"),
    status: notificationStatus("status").default("WAITING_TO_SEND"),
    createdAt: timestamp("created_at", { precision: 6 }),
    readAt: timestamp("read_at", { precision: 6 }),
    expiresAt: timestamp("expires_at", { precision: 6 }),
    itemId: serial("item_id"),
    item_type: notificationItemType("item_type").default("UNKNOWN"),
  },
  (table) => ({
    // Define the unique constraint
    userIdTypeItemIdItemTypeUnique: uniqueIndex("notifications_user_id_type_item_id_item_type_key").on(
      table.userId,
      table.type,
      table.itemId,
      table.item_type,
    ),
    // Define indexes
    userIdIndex: index("notifications_user_id_idx").on(table.userId),

    expiresAtIndex: index("notifications_expires_at_idx").on(table.expiresAt),

    itemIdItemTypeIndex: index("notifications_item_id_item_type_idx").on(
      table.itemId,
      table.item_type
    ),

    statusIndex: index("notifications_status_idx").on(table.status),

    typeIndex: index("notifications_type_idx").on(table.type),

  }),
);
