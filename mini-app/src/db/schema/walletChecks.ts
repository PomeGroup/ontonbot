import { bigint, pgTable, text, serial, uniqueIndex } from "drizzle-orm/pg-core";

/* -------------------------------------------------------------------------- */
/*                                Wallet Checks                               */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/*                     Keep track of checked transactions                     */
/* -------------------------------------------------------------------------- */

export const walletChecks = pgTable(
  "wallet_checks",
  {
    id: serial("id").primaryKey(),
    wallet_address: text("wallet_address").notNull(),
    checked_lt: bigint("checked_lt", { mode: "bigint" }),
  },
  (table) => ({
    /* -------------------------------------------------------------------------- */
    wallet_unique: uniqueIndex().on(table.wallet_address),
  })
);
