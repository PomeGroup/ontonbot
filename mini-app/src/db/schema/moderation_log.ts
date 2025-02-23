import { pgTable, serial, varchar, bigint, timestamp, index, pgEnum } from "drizzle-orm/pg-core";
import { InferSelectModel } from "drizzle-orm";

// 1) Define a Postgres enum for your moderation actions
const moderationActionEnum = pgEnum("moderation_action", ["APPROVE", "REJECT", "NOTICE"]);

/**
 * Table: moderation_log
 */
export const moderationLog = pgTable(
  "moderation_log",
  {
    // Primary key
    id: serial("id").primaryKey(),

    // ID of the moderator performing the action
    moderatorUserId: bigint("moderator_user_id", { mode: "number" }).notNull(),

    // UUID of the event being moderated
    eventUuid: varchar("event_uuid", { length: 36 }).notNull(),

    // Owner of the event
    eventOwnerId: bigint("event_owner_id", { mode: "number" }).notNull(),

    // Moderation action (APPROVE, REJECT, NOTICE)
    action: moderationActionEnum("action").notNull(),

    // Up to 4096 characters (Telegram's text message limit)
    customText: varchar("custom_text", { length: 4096 }),

    // Timestamp of when this log entry was created
    createdAt: timestamp("created_at", { precision: 6 }).defaultNow().notNull(),
  },
  (table) => ({
    // Useful indexes
    moderatorIndex: index("moderation_log_moderator_user_id_idx").on(table.moderatorUserId),
    eventUuidIndex: index("moderation_log_event_uuid_idx").on(table.eventUuid),
    actionIndex: index("moderation_log_action_idx").on(table.action),
    eventOwnerIndex: index("moderation_log_event_owner_id_idx").on(table.eventOwnerId),
  })
);

export type ModerationLogRow = InferSelectModel<typeof moderationLog>;
export const ModerationLogAction = pgEnum("moderation_action", ["APPROVE", "REJECT", "NOTICE"]);
export type ModerationLogActionType = (typeof ModerationLogAction.enumValues)[number];
