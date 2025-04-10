import { pgTable, integer, text, numeric, timestamp, serial, pgEnum, index, unique, bigint } from "drizzle-orm/pg-core";
import { InferSelectModel } from "drizzle-orm";
import { users } from "@/db/schema";

export const placeOfWalletConnection = pgEnum("campaign_type", ["campaign", "event", "sbt"]);
export const userWalletBalances = pgTable(
  "user_wallet_balances",
  {
    id: serial("id").primaryKey(),
    userId: bigint("user_id", { mode: "number" })
      .references(() => users.user_id)
      .notNull(), // the user id
    walletAddress: text("wallet_address").notNull(), // the wallet address
    placeOfConnection: placeOfWalletConnection("place_of_connection").notNull(), // the type of connection
    lastBalance: numeric("last_balance", {
      precision: 30,
      scale: 0,
    }).notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: false,
    })
      .defaultNow()
      .notNull(),
  },
  // indexes
  (table) => ({
    // unique index on userId and walletAddress and placeOfConnection
    userIdWalletAddressIdx: unique("user_id_wallet_address_idx").on(
      table.userId,
      table.walletAddress,
      table.placeOfConnection
    ),
  })
);
// select type
export type UserWalletBalances = InferSelectModel<typeof userWalletBalances>;
//  insert type
export type UserWalletBalancesInsert = Omit<InferSelectModel<typeof userWalletBalances>, "id" | "createdAt">;
//  export  place of connection
export type PlaceOfWalletConnection = (typeof placeOfWalletConnection.enumValues)[number];
