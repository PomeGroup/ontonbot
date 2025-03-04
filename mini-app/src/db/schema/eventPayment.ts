import { index, integer, pgTable, serial, text, timestamp, uuid, uniqueIndex, real, pgEnum } from "drizzle-orm/pg-core";
import { events } from "@/db/schema/events";
import { paymentTypes } from "../enum";
import { InferSelectModel } from "drizzle-orm";

export const organizerPaymentStatus = pgEnum("organizer_payment_status", ["not_payed", "payed_to_organizer", "refunded"]);
export const ticketTypes = pgEnum("ticket_types", ["NFT", "TSCSBT"]);

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
    collectionAddress: text("collection_address"), // NFT & TSCSBT
    title: text("title"),
    description: text("description").notNull(),

    organizer_payment_status: organizerPaymentStatus("organizer_payment_status").default("not_payed").notNull(),
    ticketActivityId: integer("ticket_activity_id").default(0),
    created_at: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date", precision: 3 }).$onUpdate(() => new Date()),
    updatedBy: text("updated_by").default("system").notNull(),
  },
  (table) => ({
    uniqueEven: uniqueIndex().on(table.event_uuid),
    eventUuidIdx: index("event_event_uuid_idx").on(table.event_uuid),
  })
);

export type EventPaymentSelectType = InferSelectModel<typeof eventPayment>;
export type EventPaymentType = (typeof paymentTypes.enumValues)[number];
export type EventTicketType = (typeof ticketTypes.enumValues)[number];
