/* ─────────────────────────── eventPayment.ts  (event_payment_info) ─────────────────────────── */
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

    /* payment basics */
    payment_type: paymentTypes("payment_type").notNull(),
    price: real("price").notNull(),
    recipient_address: text("recipient_address").notNull(),
    bought_capacity: integer("bought_capacity").notNull(),

    /* ticket meta */
    ticket_type: pgTicketTypes("ticket_type").notNull(), // "NFT" | "TSCSBT"
    title: text("title").notNull(), // *ticket name* (unchanged)
    description: text("description").notNull(), // *ticket description* (unchanged)

    /* NFT / SBT media & collection */
    ticketImage: text("ticket_image"),
    ticketVideo: text("ticket_video"),
    collectionAddress: text("collection_address"),

    /* organizer settlement */
    organizer_payment_status: organizerPaymentStatus("organizer_payment_status").default("not_payed").notNull(),
    ticketActivityId: integer("ticket_activity_id").default(0),

    /* meta */
    created_at: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date", precision: 3 }).$onUpdate(() => new Date()),
    updatedBy: text("updated_by").default("system").notNull(),
  },
  (t) => ({
    /* ⚠️ uniqueEven removed to allow multiple ticket definitions per event */
    eventUuidIdx: index("event_payment_event_uuid_idx").on(t.event_uuid),
    ticketTypeIdx: index("event_payment_ticket_type_idx").on(t.ticket_type),
  })
);

export type EventPaymentSelectType = typeof eventPayment.$inferSelect;
export type EventPaymentType = (typeof paymentTypes.enumValues)[number];
export type EventTicketType = (typeof ticketTypes)[number];
/* ─────────────────────────────────────────────────────────────────────────────── */
