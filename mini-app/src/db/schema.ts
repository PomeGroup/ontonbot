import { relations } from "drizzle-orm";
import {
  bigint,
  boolean,
  index,
  integer,
  json,
  pgEnum,
  pgTable,
  pgView,
  serial,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    user_id: bigint("user_id", { mode: "number" }).primaryKey(),
    username: text("username"),
    first_name: text("first_name"),
    last_name: text("last_name"),
    wallet_address: text("wallet_address"),
    language_code: text("language_code"),
    role: text("role").notNull(),
    created_at: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    usernameIdx: index("users_username_idx").on(table.username),
    walletAddressIdx: index("users_wallet_address_idx").on(
      table.wallet_address
    ),
    roleIdx: index("users_role_idx").on(table.role),
    createdAtIdx: index("users_created_at_idx").on(table.created_at),
  })
);

export const eventParticipationType = pgEnum("event_participation_type", [
  "in_person",
  "online",
]);
export const events = pgTable(
  "events",
  {
    event_id: serial("event_id").primaryKey(),
    event_uuid: uuid("event_uuid").notNull(),
    type: integer("type"),
    title: text("title"),
    subtitle: text("subtitle"),
    description: text("description"),
    image_url: text("image_url"),
    wallet_address: text("wallet_address"),
    wallet_seed_phrase: text("wallet_seed_phrase"),
    society_hub: text("society_hub"),
    society_hub_id: text("society_hub_id"),
    activity_id: integer("activity_id"),
    collection_address: text("collection_address"),
    secret_phrase: text("secret_phrase").default(""),
    start_date: integer("start_date"),
    end_date: integer("end_date").default(0),
    timezone: text("timezone"),
    location: text("location"),
    website: json("website"),
    owner: bigint("owner", { mode: "number" }).references(() => users.user_id),
    hidden: boolean("hidden").default(false),
    ticketToCheckIn: boolean("ticketToCheckIn").default(false),
    participationType: eventParticipationType("participation_type")
      .default("online")
      .notNull(),
    created_at: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    eventUuidIdx: index("events_event_uuid_idx").on(table.event_uuid),
    typeIdx: index("events_type_idx").on(table.type),
    titleIdx: index("events_title_idx").on(table.title),
    walletAddressIdx: index("events_wallet_address_idx").on(
      table.wallet_address
    ),
    societyHubIdx: index("events_society_hub_idx").on(table.society_hub),
    startDateIdx: index("events_start_date_idx").on(table.start_date),
    endDateIdx: index("events_end_date_idx").on(table.end_date),
    ownerIdx: index("events_owner_idx").on(table.owner),
    hiddenIdx: index("events_hidden_idx").on(table.hidden),
    createdAtIdx: index("events_created_at_idx").on(table.created_at),
    participationTypeIdx: index("events_participation_type_idx").on(
      table.participationType
    ),
  })
);

export const eventFields = pgTable(
  "event_fields",
  {
    id: serial("id").primaryKey(),
    emoji: text("emoji"),
    title: text("title"),
    description: text("description"),
    placeholder: text("placeholder"),
    type: text("type"),
    order_place: integer("order_place"),
    event_id: integer("event_id").references(() => events.event_id),
  },
  (table) => ({
    titleIdx: index("eventf_title_idx").on(table.title),
    typeIdx: index("eventf_type_idx").on(table.type),
    eventIdIdx: index("eventf_event_id_idx").on(table.event_id),
  })
);

export const visitors = pgTable(
  "visitors",
  {
    id: serial("id").primaryKey(),
    user_id: bigint("user_id", { mode: "number" }).references(
      () => users.user_id
    ),
    event_uuid: uuid("event_uuid")
      .references(() => events.event_uuid)
      .notNull(),
    claimed: integer("claimed"),
    amount: integer("amount"),
    tx_hash: text("tx_hash"),
    last_visit: timestamp("last_visit").defaultNow(),
    created_at: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    userIdIdx: index("visitors_user_id_idx").on(table.user_id),
    eventUuidIdx: index("visitors_event_uuid_idx").on(table.event_uuid),
    lastVisitIdx: index("visitors_last_visit_idx").on(table.last_visit),
    createdAtIdx: index("visitors_created_at_idx").on(table.created_at),
  })
);

export const rewardType = pgEnum("reward_types", ["ton_society_sbt"]);
export const rewardStatus = pgEnum("reward_status", [
  "pending_creation",
  "created",
  "received",
  "notified",
  "notification_failed",
  "failed",
]);
export const rewards = pgTable(
  "rewards",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    visitor_id: serial("visitor_id")
      .references(() => visitors.id)
      .notNull(),
    type: rewardType("type"),
    data: json("data"),
    tryCount: integer("try_count").default(0).notNull(),
    status: rewardStatus("status").notNull().default("created"),
    created_at: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    visitorIdIdx: index("rewards_visitor_id_idx").on(table.visitor_id),
    typeIdx: index("rewards_type_idx").on(table.type),
    statusIdx: index("rewards_status_idx").on(table.status),
    createdAtIdx: index("rewards_created_at_idx").on(table.created_at),
  })
);

export const userEventFields = pgTable(
  "user_event_fields",
  {
    id: serial("id").primaryKey(),
    event_field_id: serial("event_field_id").references(() => eventFields.id),
    event_id: integer("event_id")
      .references(() => events.event_id)
      .notNull(),
    user_id: bigint("user_id", { mode: "number" }).references(
      () => users.user_id
    ),
    data: text("data"),
    completed: boolean("completed"),
    created_at: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    unq: unique().on(table.event_field_id, table.user_id),
    eventId: index("uef_event_id_idx").on(table.event_id),
    eventFieldIdIdx: index("uef_event_field_id_idx").on(table.event_field_id),
    userIdIdx: index("uef_user_id_idx").on(table.user_id),
    completedIdx: index("uef_completed_idx").on(table.completed),
    createdAtIdx: index("uef_created_at_idx").on(table.created_at),
  })
);

export const airdropRoutines = pgTable(
  "airdrop_routines",
  {
    id: serial("id").primaryKey(),
    event_id: serial("event_id").references(() => events.event_id),
    user_id: bigint("user_id", { mode: "number" }).references(
      () => users.user_id
    ),
    status: text("status"),
    created_at: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    eventIdIdx: index("airdrop_event_id_idx").on(table.event_id),
    userIdIdx: index("airdrop_user_id_idx").on(table.user_id),
    statusIdx: index("airdrop_status_idx").on(table.status),
    createdAtIdx: index("airdrop_created_at_idx").on(table.created_at),
  })
);

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
  },
  (table) => ({
    eventUuidIdx: index("eventt_event_uuid_idx").on(table.event_uuid),
    titleIdx: index("eventt_title_idx").on(table.title),
    priceIdx: index("eventt_price_idx").on(table.price),
    collectionAddressIdx: index("eventt_collection_address_idx").on(
      table.collectionAddress
    ),
    createdAtIdx: index("eventt_created_at_idx").on(table.created_at),
  })
);

export const ticketStatus = pgEnum("event_ticket_status", [
  "MINTING",
  "USED",
  "UNUSED",
]);
export const tickets = pgTable(
  "tickets",
  {
    id: serial("id").primaryKey(),
    name: text("name"),
    telegram: text("telegram"),
    company: text("company"),
    position: text("position"),
    order_uuid: text("order_uuid").references(() => orders.uuid),
    status: ticketStatus("status"),
    nftAddress: text("nft_address"),
    event_uuid: uuid("event_uuid").references(() => events.event_uuid),
    ticket_id: integer("event_ticket_id")
      .references(() => eventTicket.id)
      .notNull(),
    user_id: bigint("user_id", { mode: "number" }).references(
      () => users.user_id
    ),
    created_at: timestamp("created_at").defaultNow(),
  },
  (table) => {
    return {
      nameIdx: index("tickets_name_idx").on(table.name),
      telegramIdx: index("tickets_telegram_idx").on(table.telegram),
      companyIdx: index("tickets_company_idx").on(table.company),
      orderUuidIdx: index("tickets_order_uuid_idx").on(table.order_uuid),
      statusIdx: index("tickets_status_idx").on(table.status),
      nftAddressIdx: index("tickets_nft_address_idx").on(table.nftAddress),
      eventUuidIdx: index("tickets_event_uuid_idx").on(table.event_uuid),
      ticketIdIdx: index("tickets_ticket_id_idx").on(table.ticket_id),
      userIdIdx: index("tickets_user_id_idx").on(table.user_id),
      createdAtIdx: index("tickets_created_at_idx").on(table.created_at),
    };
  }
);

export const orderState = pgEnum("order_state", [
  "created",
  "mint_request",
  "minted",
  "failed",
  "validation_failed",
]);
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
  })
);

// Relations remain unchanged
export const ticketsRelations = relations(tickets, ({ one }) => ({
  order: one(orders, {
    fields: [tickets.order_uuid],
    references: [orders.uuid],
  }),
  event: one(events, {
    fields: [tickets.event_uuid],
    references: [events.event_uuid],
  }),
  eventTicket: one(eventTicket, {
    fields: [tickets.ticket_id],
    references: [eventTicket.id],
  }),
  user: one(users, {
    fields: [tickets.user_id],
    references: [users.user_id],
  }),
}));

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

export const userRelations = relations(users, ({ many }) => ({
  userEventFields: many(userEventFields),
  airdropRoutines: many(airdropRoutines),
  tickets: many(tickets),
  orders: many(orders),
}));

export const eventFieldRelations = relations(eventFields, ({ one, many }) => ({
  event: one(events, {
    fields: [eventFields.event_id],
    references: [events.event_id],
  }),
  userEventFields: many(userEventFields),
}));

export const userEventFieldRelations = relations(
  userEventFields,
  ({ one }) => ({
    eventField: one(eventFields, {
      fields: [userEventFields.event_field_id],
      references: [eventFields.id],
    }),
    user: one(users, {
      fields: [userEventFields.user_id],
      references: [users.user_id],
    }),
  })
);

export const airdropRoutineRelations = relations(
  airdropRoutines,
  ({ one }) => ({
    event: one(events, {
      fields: [airdropRoutines.event_id],
      references: [events.event_id],
    }),
    user: one(users, {
      fields: [airdropRoutines.user_id],
      references: [users.user_id],
    }),
  })
);
// this view is used to get the event details with the ticket and visitor count
export const event_details_search_list = pgView("event_details_search_list", {
  event_id: integer("event_id").notNull(),
  event_uuid: uuid("event_uuid").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  start_date: integer("start_date").notNull(),
  end_date: integer("end_date").notNull(),
  type: integer("type").notNull(),
  society_hub: text("society_hub").notNull(),
  image_url: text("image_url").notNull(),
  location: text("location").notNull(),
  subtitle: text("subtitle").notNull(),
  ticketToCheckIn: boolean("ticketToCheckIn").notNull(),
  timezone: text("timezone").notNull(),
  website: text("website").notNull(),
  created_at: timestamp("created_at").notNull(),
  organizer_user_id: integer("organizer_user_id").notNull(),
  organizer_first_name: text("organizer_first_name").notNull(),
  organizer_last_name: text("organizer_last_name").notNull(),
  organizer_username: text("organizer_username").notNull(),
  reserved_count: integer("reserved_count").notNull(),
  visitor_count: integer("visitor_count").notNull(),
  ticket_id: integer("ticket_id").notNull(),
  ticket_title: text("ticket_title").notNull(),
  ticket_description: text("ticket_description").notNull(),
  ticket_price: integer("ticket_price").notNull(),
  ticket_image: text("ticket_image").notNull(),
  ticket_count: integer("ticket_count").notNull(),
  hidden: boolean("hidden").notNull(),
  participation_type: eventParticipationType("participation_type")
    .default("online")
    .notNull(),
});
