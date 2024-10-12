import {
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { events } from "@/db/schema/events";

export const eventTicket = pgTable(
  "event_tickets",
  {
    id: serial("id").primaryKey(),
    event_uuid: uuid("event_uuid").references(() => events.event_uuid),
    title: text("title"),
    description: text("description"),
    price: text("price").notNull(),
    ticketImage: text("ticket_image"),
    count: integer("count"),
    collectionAddress: text("collection_address"),
    created_at: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at", {
      mode: "date",
      precision: 3,
    }).$onUpdate(() => new Date()),
    updatedBy: text("updated_by").default("system").notNull(),
  },
  (table) => ({
    eventUuidIdx: index("eventt_event_uuid_idx").on(table.event_uuid),
    titleIdx: index("eventt_title_idx").on(table.title),
    priceIdx: index("eventt_price_idx").on(table.price),
    collectionAddressIdx: index("eventt_collection_address_idx").on(
      table.collectionAddress
    ),
    createdAtIdx: index("eventt_created_at_idx").on(table.created_at),
    updatedAtIdx: index("eventt_updated_at_idx").on(table.updatedAt),
  })
);
