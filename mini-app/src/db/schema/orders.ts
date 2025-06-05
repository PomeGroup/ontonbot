import { bigint, index, integer, pgEnum, pgTable, real, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { coupon_items, orderState, paymentTypes } from "@/db/schema";
import { events } from "@/db/schema/events";
import { eventPayment } from "@/db/schema/eventPayment";
import { users } from "@/db/schema/users";
import { InferSelectModel, relations } from "drizzle-orm";

/* ───── enums ───── */
export const orderTypeValues = [
  "nft_mint",
  "event_creation",
  "event_capacity_increment",
  "promote_to_organizer",
  "ts_csbt_ticket",
] as const;
export const orderTypes = pgEnum("order_types", orderTypeValues);

/* ───── table ───── */
export const orders = pgTable(
  "orders",
  {
    uuid: uuid("uuid").defaultRandom().primaryKey(),

    /* what event & what ticket-definition was bought */
    event_uuid: uuid("event_uuid").references(() => events.event_uuid),
    event_payment_id: integer("event_payment_id").references(() => eventPayment.id),

    user_id: bigint("user_id", { mode: "number" }).references(() => users.user_id),

    /* prices are *per order* (ticket_count × single-ticket default_price) */
    default_price: real("default_price").default(0).notNull(), // BEFORE coupon/discount
    total_price: real("total_price").notNull(), // AFTER coupon/discount
    ticket_count: integer("ticket_count").default(1).notNull(),

    payment_type: paymentTypes("payment_type").notNull(),
    state: orderState("state").notNull(),
    order_type: orderTypes("order_type").notNull(),

    owner_address: text("owner_address"), // TON owner

    trx_hash: text("trx_hash"),
    utm_source: text("utm_source").default(""),

    coupon_id: bigint("coupon_id", { mode: "number" }).references(() => coupon_items.id),

    created_at: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date", precision: 3 }).$onUpdate(() => new Date()),
    updatedBy: text("updated_by").default("system").notNull(),
  },
  (t) => ({
    eventUuidIdx: index("orders_event_uuid_idx").on(t.event_uuid),
    eventPaymentIdx: index("orders_event_payment_idx").on(t.event_payment_id),
    userIdIdx: index("orders_user_id_idx").on(t.user_id),
    stateIdx: index("orders_state_idx").on(t.state),
    ownerAddressIdx: index("orders_owner_address_idx").on(t.owner_address),
    couponIdIdx: index("orders_coupon_id_idx").on(t.coupon_id),
  })
);

/* ───── relations ───── */
export const orderRelations = relations(orders, ({ one }) => ({
  event: one(events, {
    fields: [orders.event_uuid],
    references: [events.event_uuid],
  }),
  ticketDef: one(eventPayment, {
    fields: [orders.event_payment_id],
    references: [eventPayment.id],
  }),
  user: one(users, {
    fields: [orders.user_id],
    references: [users.user_id],
  }),
}));

export type OrderRow = InferSelectModel<typeof orders>;
export type OrderTypeValues = (typeof orderTypeValues)[number];
