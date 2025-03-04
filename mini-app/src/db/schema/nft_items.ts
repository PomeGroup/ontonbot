import { users } from "@/db/schema/users";
import { bigint, pgTable, serial, uuid, text, uniqueIndex, timestamp, jsonb } from "drizzle-orm/pg-core";
import { orders } from "./orders";

export const nftItems = pgTable(
  "nft_items",
  {
    id: serial("id").primaryKey(),
    event_uuid: uuid("event_uuid").notNull(),
    order_uuid: uuid("order_uuid").references(() => orders.uuid).notNull(),
    // user_id: bigint("user_id", { mode: "number" }).references(() => users.user_id),
    nft_address: text("nft_address").notNull(),
    owner: bigint("owner", { mode: "number" }).references(() => users.user_id),
    created_at: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at", {
      mode: "date",
      precision: 3,
    }).$onUpdate(() => new Date()),
    updatedBy: text("updated_by").default("system").notNull(),
  },
  (table) => ({
    uniqueEventUser: uniqueIndex().on(table.order_uuid),
  })
);
