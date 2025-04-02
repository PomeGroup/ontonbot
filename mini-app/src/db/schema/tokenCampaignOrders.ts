import { pgTable, bigint, varchar, numeric, serial, timestamp, text, index } from "drizzle-orm/pg-core";
import { InferSelectModel } from "drizzle-orm";
import { users } from "@/db/schema/users";
import { orderState, paymentTypes } from "@/db/enum";

export const tokenCampaignOrders = pgTable(
  "token_campaign_orders",
  {
    id: serial("id").notNull().primaryKey(),
    spinPackageId: bigint("spin_package_id", { mode: "number" }).notNull(),
    finalPrice: numeric("final_price", { precision: 10, scale: 2 }).notNull(),
    defaultPrice: numeric("default_price", { precision: 10, scale: 2 }).notNull(), // Consider renaming to `defaultPrice`
    wallet_address: varchar("wallet_address", { length: 255 }),
    status: orderState("state").notNull().default("new"),
    currency: paymentTypes("payment_type").notNull(),
    affiliateHash: varchar("affiliate_hash", { length: 255 }),
    couponId: bigint("coupon_id", { mode: "number" }),
    trxHash: varchar("trx_hash", { length: 255 }),
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.user_id),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date", precision: 3 }).$onUpdate(() => new Date()),
    updatedBy: text("updated_by").default("system").notNull(),
  },
  // indexes
  (table) => ({
    spinPackageIdIdx: index("spin_package_id_idx").on(table.spinPackageId),
    userIdIdx: index("user_id_idx").on(table.userId),
    trxHashIdx: index("trx_hash_idx").on(table.trxHash),
  })
);

/**
 * SELECT type
 * Represents the shape of a row *selected* from the table.
 */
export type TokenCampaignOrders = InferSelectModel<typeof tokenCampaignOrders>;

/**
 * INSERT type
 * Omit columns that:
 *   1) are auto-generated (e.g., `id`).
 *   2) have default values you typically don't supply (e.g., `createdAt`, `updatedAt`).
 */
export type TokenCampaignOrdersInsert = Omit<
  InferSelectModel<typeof tokenCampaignOrders>,
  "id" | "createdAt" | "updatedAt" | "affiliateHash" | "couponId" | "trxHash" | "updatedBy"
>;

export type TokenCampaignOrdersStatus = (typeof orderState.enumValues)[number];
