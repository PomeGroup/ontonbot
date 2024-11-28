import { json, pgSequence, pgTable, serial, smallint, timestamp, varchar } from "drizzle-orm/pg-core";
import { notificationStatus, notificationType ,notificationItemType } from "@/db/enum";
import { sql } from "drizzle-orm";


// Define the sequence for `notifications`
export const notificationsIdSequence = pgSequence("notifications_id_seq", {
  increment: 1,
  minValue: 1,
  maxValue: "9223372036854775807",
  startWith: 1,
  cache: 1,
  cycle: false,
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey().default(sql`nextval('${notificationsIdSequence.seqName}'::regclass)`),
  userId: serial("user_id"),
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
});
