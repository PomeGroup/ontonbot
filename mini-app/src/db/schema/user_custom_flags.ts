import { bigint, text, timestamp, pgTable, pgEnum, serial, uniqueIndex, boolean } from "drizzle-orm/pg-core";
import { users } from "./users";

// Define enum for user flags
export const user_flags = pgEnum("user_flags_enum", [
  "event_moderator",
  "ton_society_verified",
  "api_key",
  "custom_registration_1",
]);
// Define type for user flags
export type userFlagsType = (typeof user_flags.enumValues)[number];
// Define the table
export const user_custom_flags = pgTable(
  "user_custom_flags",
  {
    id: serial("id").primaryKey(), // Add a serial ID as the primary key
    user_id: bigint("user_id", { mode: "number" }).references(() => users.user_id),
    user_flag: user_flags("user_flag").notNull(), // Flag
    value: text("value"),
    enabled: boolean("enabled").default(true),

    created_at: timestamp("created_at").defaultNow(), // Timestamp for record creation
    updated_at: timestamp("updated_at", {
      mode: "date",
      precision: 3,
    }).$onUpdate(() => new Date()), // Auto-update timestamp for modifications
  },
  (table) => ({
    userRoleUnique: uniqueIndex().on(table.user_id, table.user_flag),
  })
);
