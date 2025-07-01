import { pgTable, serial, integer, bigint, text, timestamp, pgEnum, index, uniqueIndex } from "drizzle-orm/pg-core";
import { users } from "@/db/schema/users";
import { eventMerchPrizes } from "./eventMerchPrizes";
import { InferSelectModel } from "drizzle-orm";

export const eventMerchPrizeResultStatus = pgEnum("merch_result_status", [
  "pending",
  "awaiting_address",
  "awaiting_pickup",
  "shipped",
  "delivered",
  "collected",
  "failed",
]);

export const eventMerchPrizeResults = pgTable(
  "event_merch_prize_results",
  {
    id: serial("id").primaryKey(),
    merch_prize_id: integer("merch_prize_id")
      .references(() => eventMerchPrizes.merch_prize_id, {
        onDelete: "cascade",
      })
      .notNull(),
    user_id: bigint("user_id", { mode: "number" })
      .references(() => users.user_id)
      .notNull(),

    score: integer("score").notNull(),
    rank: integer("rank"),

    status: eventMerchPrizeResultStatus("status").default("pending").notNull(),

    /* shipping fields */
    full_name: text("full_name"),
    shipping_address: text("shipping_address"),
    phone: text("phone"),
    tracking_number: text("tracking_number"),

    shipped_at: timestamp("shipped_at"),
    delivered_at: timestamp("delivered_at"),
    collected_at: timestamp("collected_at"),

    created_at: timestamp("created_at").defaultNow(),
    updated_at: timestamp("updated_at", { mode: "date", precision: 3 }).$onUpdate(() => new Date()),
  },
  (t) => ({
    uniq: uniqueIndex("merch_prize_user_unique").on(t.merch_prize_id, t.user_id),
    prizeIdx: index("merch_results_prize_idx").on(t.merch_prize_id),
  })
);
export type EventMerchPrizeResultRow = InferSelectModel<typeof eventMerchPrizeResults>;
export type EventMerchPrizeResultStatusType = (typeof eventMerchPrizeResultStatus.enumValues)[number];
export type EventMerchPrizeResultInsert = Omit<EventMerchPrizeResultRow, "id" | "created_at" | "updated_at">;
