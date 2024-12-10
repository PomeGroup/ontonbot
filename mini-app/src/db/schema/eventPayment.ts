import { index, integer, pgEnum, pgTable, serial, text, timestamp, uuid, uniqueIndex } from "drizzle-orm/pg-core";
import { events } from "@/db/schema/events";
import { paymentTypes } from "../enum";

export const ticketTypes = pgEnum("ticket_types", ["OFFCHAIN", "NFT"]);

export const eventPayment = pgTable(
  "event_payment_info",
  {
    id: serial("id").primaryKey(),
    event_uuid: uuid("event_uuid").references(() => events.event_uuid),

    
    /* -------------------------- Payment Core Columns -------------------------- */
    payment_type: paymentTypes("payment_type").notNull(),
    price: integer("price").notNull(),
    recipient_address: text("recipient_address").notNull(),
    /* -------------------------------------------------------------------------- */
    ticket_type: ticketTypes("ticket_type").notNull(),
    /* ----------------------------- USED IF HAS NFT ---------------------------- */
    ticketImage: text("ticket_image"),
    collectionAddress: text("collection_address"),
    title: text("title"),
    description: text("description"),

    created_at: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date", precision: 3 }).$onUpdate(() => new Date()),
    updatedBy: text("updated_by").default("system").notNull(),
  },
  (table) => ({
    uniqueEven: uniqueIndex().on(table.event_uuid),
    eventUuidIdx: index("eventt_event_uuid_idx").on(table.event_uuid),
    // titleIdx: index("eventt_title_idx").on(table.title),
    priceIdx: index("eventt_price_idx").on(table.price),
    collectionAddressIdx: index("eventt_collection_address_idx").on(table.collectionAddress),
    createdAtIdx: index("eventt_created_at_idx").on(table.created_at),
    updatedAtIdx: index("eventt_updated_at_idx").on(table.updatedAt),
  })
);
