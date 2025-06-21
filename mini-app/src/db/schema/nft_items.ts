import { users } from "@/db/schema/users";
import { bigint, pgTable, serial, uuid, text, uniqueIndex, timestamp, jsonb } from "drizzle-orm/pg-core";
import { orders } from "./orders";
import { eventRegistrants } from "./eventRegistrants";
import { sql } from "drizzle-orm";

export const nftItems = pgTable(
  "nft_items",
  {
    id: serial("id").primaryKey(),
    event_uuid: uuid("event_uuid").notNull(),
    order_uuid: uuid("order_uuid")
      .references(() => orders.uuid)
      .notNull(),
    // user_id: bigint("user_id", { mode: "number" }).references(() => users.user_id),
    nft_address: text("nft_address").notNull(),
    owner: bigint("owner", { mode: "number" }).references(() => users.user_id),
    registrant_id: bigint("registrant_id", { mode: "number" }).references(() => eventRegistrants.id),
    created_at: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at", {
      mode: "date",
      precision: 3,
    }).$onUpdate(() => new Date()),
    updatedBy: text("updated_by").default("system").notNull(),
  },
  (table) => ({
    orderRegistrantUq: uniqueIndex("nft_items_order_reg_uq")
      .on(table.order_uuid, table.registrant_id)
      .where(sql`${table.registrant_id} IS NOT NULL`),
  })
);
