import {
  pgTable,
  integer,
  text,
  numeric,
  timestamp,
  serial,
  pgEnum,
  index,
  unique,
  bigint,
  real,
} from "drizzle-orm/pg-core";
import { InferSelectModel } from "drizzle-orm";
import { users } from "@/db/schema";
import { orderTypeValues } from "@/db/schema/orders";

export const placeOfWalletConnection = pgEnum("campaign_type", [
  "campaign",
  "event",
  "sbt",
  "just_connected",
  ...orderTypeValues,
]);
export const userWalletBalances = pgTable(
  "user_wallet_balances",
  {
    id: serial("id").primaryKey(),
    userId: bigint("user_id", { mode: "number" })
      .references(() => users.user_id)
      .notNull(), // the user id
    walletAddress: text("wallet_address").notNull(), // the wallet address
    placeOfConnection: placeOfWalletConnection("place_of_connection").notNull(), // the type of connection
    lastBalance: real("last_balance").notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: false,
    })
      .defaultNow()
      .notNull(),
    lastCheckedAt: timestamp("last_checked_at", {
      withTimezone: false,
    }).notNull(),
  },
  // indexes
  (table) => ({
    // unique index on userId and walletAddress and placeOfConnection
    userIdWalletAddressIdx: unique("user_id_wallet_address_idx").on(
      table.userId,
      table.walletAddress,
      table.placeOfConnection
    ),
    // index on lastCheckedAt
    lastCheckedAtIdx: index("last_checked_at_idx").on(table.lastCheckedAt),
    walletAddressIdx: index("user_wallet_balances_wallet_address_idx").on(table.walletAddress),
  })
);
// select type
export type UserWalletBalances = InferSelectModel<typeof userWalletBalances>;
//  insert type
export type UserWalletBalancesInsert = Omit<InferSelectModel<typeof userWalletBalances>, "id" | "createdAt">;
//  export  place of connection
export type PlaceOfWalletConnection = (typeof placeOfWalletConnection.enumValues)[number];
