import {
  bigint,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { orderState } from "@/db/schema";
import { events } from "@/db/schema/events";
import { users } from "@/db/schema/users";
import { eventTicket } from "@/db/schema/eventTicket";
import { relations } from "drizzle-orm";
import { tickets } from "@/db/schema/tickets";
export const orders = pgTable(
  "orders",
  {
    uuid: uuid("uuid").defaultRandom().primaryKey(),
    event_uuid: uuid("event_uuid").references(() => events.event_uuid),
    user_id: bigint("user_id", { mode: "number" }).references(
      () => users.user_id
    ),
    event_ticket_id: bigint("event_ticket_id", { mode: "number" })
      .references(() => eventTicket.id)
      .notNull(),
    transaction_id: text("transaction_id"),
    count: integer("count"),
    total_price: bigint("total_price", { mode: "bigint" }),
    state: orderState("state"),
    failed_reason: text("failed_reason"),
    telegram: text("telegram").notNull(),
    full_name: text("full_name").notNull(),
    company: text("company").notNull(),
    position: text("position").notNull(),
    owner_address: text("owner_address").notNull(),
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
    eventTicketIdIdx: index("orders_event_ticket_id_idx").on(
      table.event_ticket_id
    ),
    transactionIdIdx: index("orders_transaction_id_idx").on(
      table.transaction_id
    ),
    stateIdx: index("orders_state_idx").on(table.state),
    telegramIdx: index("orders_telegram_idx").on(table.telegram),
    fullNameIdx: index("orders_full_name_idx").on(table.full_name),
    companyIdx: index("orders_company_idx").on(table.company),
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
  eventTicket: one(eventTicket, {
    fields: [orders.event_ticket_id],
    references: [eventTicket.id],
  }),
  tickets: many(tickets),
}));
