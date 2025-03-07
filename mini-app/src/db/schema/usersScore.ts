import { pgTable, bigserial, bigint, smallint, timestamp, boolean, index, uniqueIndex, pgEnum } from "drizzle-orm/pg-core";
import { InferSelectModel } from "drizzle-orm";
import { users } from "@/db/schema";

// Define ENUM types
export const userScoreItem = pgEnum("user_score_item_type", ["event", "task"]);

export const activityTypesArray = [
  "free_online_event",
  "free_offline_event",
  "paid_online_event",
  "paid_offline_event",
  "join_onton",
] as const;
export const usersScoreActivity = pgEnum("users_score_activity_type", activityTypesArray);

// Create the users_score table
export const usersScore = pgTable(
  "users_score",
  {
    id: bigserial("id", { mode: "bigint" }).primaryKey(),
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.user_id),
    activityType: usersScoreActivity("activity_type"),
    point: smallint("point"),
    active: boolean("active"),
    itemId: bigint("item_id", { mode: "number" }),
    itemType: userScoreItem("item_type"),
    createdAt: timestamp("created_at", { precision: 6 }),
  },
  (table) => ({
    // Unique constraint: user_id, activity_type, active, item_id, item_type
    userIdActivityTypeActiveItemIdItemTypeUnique: uniqueIndex(
      "users_score_user_id_activity_type_active_item_id_item_type_key"
    ).on(table.userId, table.activityType, table.active, table.itemId, table.itemType),
    // Index on activity_type
    activityTypeIndex: index("users_score_activity_type_idx").on(table.activityType),
    // Composite index on item_id and item_type
    itemIdItemTypeIndex: index("users_score_item_id_item_type_idx").on(table.itemId, table.itemType),
    // Index on user_id
    userIdIndex: index("users_score_user_id_idx").on(table.userId),
  })
);

export type UsersScoreType = InferSelectModel<typeof usersScore>;
export type UserScoreItemType = (typeof userScoreItem.enumValues)[number];
export type UsersScoreActivityType = (typeof usersScoreActivity.enumValues)[number];
