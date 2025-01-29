import {
  pgTable,
  pgEnum,
  primaryKey,
  index,
  bigint,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { eventPoaResultStatus } from "@/db/enum";

// Existing enums:
export const accessRoleItemTypeEnum = pgEnum("item_type", ["event"]);
export const accessRoleEnum = pgEnum("access_role", [
  "owner",
  "admin",
  "checkin_officer",
]);
export type accessRoleItemType = (typeof accessRoleItemTypeEnum.enumValues)[number];
/**
 * New enum for user role status
 * with values 'active' and 'reactive'.
 */
export const userRoleStatusEnum = pgEnum("user_role_status", [
  "active",
  "reactive",
]);

export const userRoles = pgTable(
  "user_roles",
  {
    itemId: bigint("item_id", { mode: "number" }).notNull(),
    itemType: accessRoleItemTypeEnum("item_type").notNull(),
    userId: bigint("user_id", { mode: "number" }).notNull(),
    role: accessRoleEnum("role").notNull(),

    /**
     * New column: status (enum: 'active', 'reactive')
     * Default is 'active'
     */
    status: userRoleStatusEnum("status").notNull().default("active"),

    createdAt: timestamp("created_at", {
      withTimezone: true,
      precision: 6,
    })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", {
      mode: "date",
      precision: 3,
    }),
    updatedBy: text("updated_by").default("system").notNull(),
  },
  (table) => {
    return {
      // Composite primary key
      pk: primaryKey(table.itemId, table.itemType, table.userId, table.role),

      // Index on (item_id, item_type)
      itemIdItemTypeIdx: index("user_roles_item_id_item_type_idx").on(
        table.itemId,
        table.itemType
      ),

      // Index on user_id
      userIdIdx: index("user_roles_user_id_idx").on(table.userId),
    };
  }
);

/**
 * Relations (FK to `users`)
 */
export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.user_id],
  }),
}));
