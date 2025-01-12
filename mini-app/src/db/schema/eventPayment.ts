import {
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
  uniqueIndex,
  real,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { events } from "@/db/schema/events";
import { paymentTypes, ticketTypes } from "../enum";
import { InferSelectModel } from "drizzle-orm";

export const organizerPaymentStatus = pgEnum("organizer_payment_status", ["not_payed", "payed_to_organizer", "refunded"]);

export const eventPayment = pgTable(
  "event_payment_info",
  {
    id: serial("id").primaryKey(),
    event_uuid: uuid("event_uuid").references(() => events.event_uuid),

    /* -------------------------- Payment Core Columns -------------------------- */
    payment_type: paymentTypes("payment_type").notNull(),
    price: real("price").notNull(),
    recipient_address: text("recipient_address").notNull(),
    bought_capacity: integer("bought_capacity").notNull(),
    /* -------------------------------------------------------------------------- */
    ticket_type: ticketTypes("ticket_type").notNull(),
    /* ----------------------------- USED IF HAS NFT ---------------------------- */
    ticketImage: text("ticket_image"),
    collectionAddress: text("collection_address"),
    title: text("title"),
    description: text("description"),

    organizer_payment_status: organizerPaymentStatus("organizer_payment_status").default("not_payed").notNull(),

    created_at: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date", precision: 3 }).$onUpdate(() => new Date()),
    updatedBy: text("updated_by").default("system").notNull(),
  },
  (table) => ({
    uniqueEven: uniqueIndex().on(table.event_uuid),
    eventUuidIdx: index("eventt_event_uuid_idx").on(table.event_uuid),
  })
);

export type EventPaymentSelectType = InferSelectModel<typeof eventPayment>;
