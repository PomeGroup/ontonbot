import { airdropRoutines } from "@/db/schema/airdropRoutines";
import { tickets } from "@/db/schema/tickets";
import { userEventFields } from "@/db/schema/userEventFields";
import { relations } from "drizzle-orm";
import { bigint, index, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    user_id: bigint("user_id", { mode: "number" }).primaryKey(),
    username: text("username"),
    first_name: text("first_name"),
    last_name: text("last_name"),
    wallet_address: text("wallet_address"),
    language_code: text("language_code"),
    role: text("role").notNull(),
    created_at: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at", {
      mode: "date",
      precision: 3,
    }).$onUpdate(() => new Date()),
    updatedBy: text("updated_by").default("system").notNull(),
  },
  (table) => ({
    usernameIdx: index("users_username_idx").on(table.username),
    walletAddressIdx: index("users_wallet_address_idx").on(
      table.wallet_address
    ),
    roleIdx: index("users_role_idx").on(table.role),
    createdAtIdx: index("users_created_at_idx").on(table.created_at),
    updatedAtIdx: index("users_updated_at_idx").on(table.updatedAt),
  })
);

// Relations
export const userRelations = relations(users, ({ many }) => ({
  userEventFields: many(userEventFields),
  airdropRoutines: many(airdropRoutines),
  tickets: many(tickets),
  //   orders: many(orders),
}));
