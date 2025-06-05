import { events } from "@/db/schema/events";
import { index, integer, pgEnum, pgTable, real, serial, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { paymentTypes } from "../enum";

/* ───── enums ───── */
export const organizerPaymentStatus = pgEnum("organizer_payment_status", ["not_payed", "payed_to_organizer", "refunded"]);

export const ticketTypes = ["NFT", "TSCSBT"] as const;
export const pgTicketTypes = pgEnum("ticket_types", ticketTypes);

/* ───── table ───── */
export const eventPayment = pgTable(
  "event_payment_info",
  {
    id: serial("id").primaryKey(),
    event_uuid: uuid("event_uuid")
      .notNull()
      .references(() => events.event_uuid),

    /* TICKET-DEFINITION columns */
    ticket_name: text("ticket_name") // e.g. "VIP", "General"
      .notNull(),
    ticket_type: pgTicketTypes("ticket_type") // "NFT" | "TSCSBT"
      .notNull(),
    price: real("price") // price per ticket before discount
      .notNull(),
    capacity: integer("capacity") // max sellable quantity for this ticket type
      .notNull(),

    /* PAYMENT columns */
    payment_type: paymentTypes("payment_type").notNull(), // TON, USDT-TON, …
    recipient_address: text("recipient_address").notNull(),

    /* NFT / SBT media + collection */
    ticketImage: text("ticket_image"),
    ticketVideo: text("ticket_video"),
    collectionAddress: text("collection_address"),

    organizer_payment_status: organizerPaymentStatus("organizer_payment_status").default("not_payed").notNull(),
    ticketActivityId: integer("ticket_activity_id").default(0),

    /* meta */
    created_at: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date", precision: 3 }).$onUpdate(() => new Date()),
    updatedBy: text("updated_by").default("system").notNull(),
  },
  (t) => ({
    /* ⚠️ UNIQUE constraint on event_uuid REMOVED to allow multiple ticket definitions */
    eventUuidIdx: index("event_payment_event_uuid_idx").on(t.event_uuid),
    ticketNameIdx: index("event_payment_ticket_name_idx").on(t.ticket_name),
  })
);

export type EventPaymentSelectType = typeof eventPayment.$inferSelect;
export type EventTicketType = (typeof ticketTypes)[number];
