import { bigint, index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { orderState, orderTypes, paymentTypes } from "@/db/schema";
import { events } from "@/db/schema/events";
import { users } from "@/db/schema/users";
import { relations } from "drizzle-orm";
export const orders = pgTable(
  "orders",
  {
    uuid: uuid("uuid").defaultRandom().primaryKey(),
    event_uuid: uuid("event_uuid").references(() => events.event_uuid),
    user_id: bigint("user_id", { mode: "number" }).references(() => users.user_id),

    total_price: bigint("total_price", { mode: "bigint" }),
    payment_type: paymentTypes("payment_type").notNull(),

    state: orderState("state"),
    order_type: orderTypes("order_type"),
    owner_address: text("owner_address").notNull(),

    utm_source: text("utm_source").default(""),
    created_at: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at", {
      mode: "date",
      precision: 3,
    }).$onUpdate(() => new Date()),
    updatedBy: text("updated_by").default("system").notNull(),
  },
  (table) => ({
    eventUuidIdx: index("orders_event_uuid_idx").on(table.event_uuid),
    userIdIdx: index("orders_user_id_idx").on(table.user_id),
    stateIdx: index("orders_state_idx").on(table.state),
    ownerAddressIdx: index("orders_owner_address_idx").on(table.owner_address),
    createdAtIdx: index("orders_created_at_idx").on(table.created_at),
    updatedAtIdx: index("orders_updated_at_idx").on(table.updatedAt),
  })
);

// Relations
export const orderRelations = relations(orders, ({ one, many }) => ({
  event: one(events, {
    fields: [orders.event_uuid],
    references: [events.event_uuid],
  }),
  user: one(users, {
    fields: [orders.user_id],
    references: [users.user_id],
  }),
}));
