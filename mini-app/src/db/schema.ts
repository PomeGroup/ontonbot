import { relations } from 'drizzle-orm'
import {
    bigint,
    boolean,
    index,
    integer,
    json,
    pgEnum,
    pgTable,
    serial,
    text,
    timestamp,
    unique,
    uuid,
} from 'drizzle-orm/pg-core'

export const users = pgTable(
    'users',
    {
        user_id: bigint('user_id', { mode: 'number' }).primaryKey(),
        username: text('username'),
        first_name: text('first_name'),
        last_name: text('last_name'),
        wallet_address: text('wallet_address'),
        language_code: text('language_code'),
        role: text('role').notNull(),
        created_at: timestamp('created_at').defaultNow(),
    },
    (table) => ({
        usernameIdx: index('username_idx').on(table.username),
        walletAddressIdx: index('wallet_address_idx').on(table.wallet_address),
        roleIdx: index('role_idx').on(table.role),
        createdAtIdx: index('created_at_idx').on(table.created_at),
    })
)

export const events = pgTable(
    'events',
    {
        event_id: serial('event_id').primaryKey(),
        event_uuid: uuid('event_uuid'),
        type: integer('type'),
        title: text('title'),
        subtitle: text('subtitle'),
        description: text('description'),
        image_url: text('image_url'),
        wallet_address: text('wallet_address'),
        wallet_seed_phrase: text('wallet_seed_phrase'),
        society_hub: text('society_hub'),
        society_hub_id: text('society_hub_id'),
        activity_id: integer('activity_id'),
        collection_address: text('collection_address'),
        secret_phrase: text('secret_phrase').default(''),
        start_date: integer('start_date'),
        end_date: integer('end_date').default(0),
        timezone: text('timezone'),
        location: text('location'),
        website: json('website'),
        owner: bigint('owner', { mode: 'number' }).references(
            () => users.user_id
        ),
        hidden: boolean('hidden').default(false),
        ticketToCheckIn: boolean('ticketToCheckIn').default(false),
        created_at: timestamp('created_at').defaultNow(),
    },
    (table) => ({
        eventUuidIdx: index('event_uuid_idx').on(table.event_uuid),
        typeIdx: index('type_idx').on(table.type),
        titleIdx: index('title_idx').on(table.title),
        walletAddressIdx: index('wallet_address_idx').on(table.wallet_address),
        societyHubIdx: index('society_hub_idx').on(table.society_hub),
        startDateIdx: index('start_date_idx').on(table.start_date),
        endDateIdx: index('end_date_idx').on(table.end_date),
        ownerIdx: index('owner_idx').on(table.owner),
        hiddenIdx: index('hidden_idx').on(table.hidden),
        createdAtIdx: index('created_at_idx').on(table.created_at),
    })
)

export const eventFields = pgTable(
    'event_fields',
    {
        id: serial('id').primaryKey(),
        emoji: text('emoji'),
        title: text('title'),
        description: text('description'),
        placeholder: text('placeholder'),
        type: text('type'),
        order_place: integer('order_place'),
        event_id: integer('event_id').references(() => events.event_id),
    },
    (table) => ({
        titleIdx: index('title_idx').on(table.title),
        typeIdx: index('type_idx').on(table.type),
        eventIdIdx: index('event_id_idx').on(table.event_id),
    })
)

export const visitors = pgTable(
    'visitors',
    {
        id: serial('id').primaryKey(),
        user_id: bigint('user_id', { mode: 'number' }).references(
            () => users.user_id
        ),
        event_uuid: uuid('event_uuid').references(() => events.event_uuid),
        claimed: integer('claimed'),
        amount: integer('amount'),
        tx_hash: text('tx_hash'),
        last_visit: timestamp('last_visit').defaultNow(),
        created_at: timestamp('created_at').defaultNow(),
    },
    (table) => ({
        userIdIdx: index('user_id_idx').on(table.user_id),
        eventUuidIdx: index('event_uuid_idx').on(table.event_uuid),
        lastVisitIdx: index('last_visit_idx').on(table.last_visit),
        createdAtIdx: index('created_at_idx').on(table.created_at),
    })
)

export const rewardType = pgEnum('reward_types', ['ton_society_sbt'])
export const rewardStatus = pgEnum('reward_status', [
    'pending_creation',
    'created',
    'received',
    'notified',
    'notification_failed',
    'failed',
])
export const rewards = pgTable(
    'rewards',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        visitor_id: serial('visitor_id')
            .references(() => visitors.id)
            .notNull(),
        type: rewardType('type'),
        data: json('data'),
        tryCount: integer('try_count').default(0).notNull(),
        status: rewardStatus('status').notNull().default('created'),
        created_at: timestamp('created_at').defaultNow(),
    },
    (table) => ({
        visitorIdIdx: index('visitor_id_idx').on(table.visitor_id),
        typeIdx: index('type_idx').on(table.type),
        statusIdx: index('status_idx').on(table.status),
        createdAtIdx: index('created_at_idx').on(table.created_at),
    })
)

export const userEventFields = pgTable(
    'user_event_fields',
    {
        id: serial('id').primaryKey(),
        event_field_id: serial('event_field_id').references(
            () => eventFields.id
        ),
        event_id: integer('event_id')
            .references(() => events.event_id)
            .notNull(),
        user_id: bigint('user_id', { mode: 'number' }).references(
            () => users.user_id
        ),
        data: text('data'),
        completed: boolean('completed'),
        created_at: timestamp('created_at').defaultNow(),
    },
    (table) => ({
        unq: unique().on(table.event_field_id, table.user_id),
        eventId: index('uef_event_id_idx').on(table.event_id),
        eventFieldIdIdx: index('event_field_id_idx').on(table.event_field_id),
        userIdIdx: index('user_id_idx').on(table.user_id),
        completedIdx: index('completed_idx').on(table.completed),
        createdAtIdx: index('created_at_idx').on(table.created_at),
    })
)

export const airdropRoutines = pgTable(
    'airdrop_routines',
    {
        id: serial('id').primaryKey(),
        event_id: serial('event_id').references(() => events.event_id),
        user_id: bigint('user_id', { mode: 'number' }).references(
            () => users.user_id
        ),
        status: text('status'),
        created_at: timestamp('created_at').defaultNow(),
    },
    (table) => ({
        eventIdIdx: index('event_id_idx').on(table.event_id),
        userIdIdx: index('user_id_idx').on(table.user_id),
        statusIdx: index('status_idx').on(table.status),
        createdAtIdx: index('created_at_idx').on(table.created_at),
    })
)

export const eventTicket = pgTable(
    'event_tickets',
    {
        id: serial('id').primaryKey(),
        event_uuid: text('event_uuid').references(() => events.event_uuid),
        title: text('title'),
        description: text('description'),
        price: text('price').notNull(),
        ticketImage: text('ticket_image'),
        count: integer('count'),
        collectionAddress: text('collection_address'),
        created_at: timestamp('created_at').defaultNow(),
    },
    (table) => ({
        eventUuidIdx: index('event_uuid_idx').on(table.event_uuid),
        titleIdx: index('title_idx').on(table.title),
        priceIdx: index('price_idx').on(table.price),
        collectionAddressIdx: index('collection_address_idx').on(
            table.collectionAddress
        ),
        createdAtIdx: index('created_at_idx').on(table.created_at),
    })
)

export const ticketStatus = pgEnum('event_ticket_status', [
    'MINTING',
    'USED',
    'UNUSED',
])
export const tickets = pgTable(
    'tickets',
    {
        id: serial('id').primaryKey(),
        name: text('name'),
        telegram: text('telegram'),
        company: text('company'),
        position: text('position'),
        order_uuid: text('order_uuid').references(() => orders.uuid),
        status: ticketStatus('status'),
        nftAddress: text('nft_address'),
        event_uuid: text('event_uuid').references(() => events.event_uuid),
        ticket_id: integer('event_ticket_id')
            .references(() => eventTicket.id)
            .notNull(),
        user_id: bigint('user_id', { mode: 'number' }).references(
            () => users.user_id
        ),
        created_at: timestamp('created_at').defaultNow(),
    },
    (table) => {
        return {
            nameIdx: index('name_idx').on(table.name),
            telegramIdx: index('telegram_idx').on(table.telegram),
            companyIdx: index('company_idx').on(table.company),
            orderUuidIdx: index('order_uuid_idx').on(table.order_uuid),
            statusIdx: index('status_idx').on(table.status),
            nftAddressIdx: index('nft_address_idx').on(table.nftAddress),
            eventUuidIdx: index('event_uuid_idx').on(table.event_uuid),
            ticketIdIdx: index('ticket_id_idx').on(table.ticket_id),
            userIdIdx: index('user_id_idx').on(table.user_id),
            createdAtIdx: index('created_at_idx').on(table.created_at),
        }
    }
)

export const orderState = pgEnum('order_state', [
    'created',
    'mint_request',
    'minted',
    'failed',
    'validation_failed',
])
export const orders = pgTable(
    'orders',
    {
        uuid: uuid('uuid').defaultRandom().primaryKey(),
        event_uuid: text('event_uuid').references(() => events.event_uuid),
        user_id: bigint('user_id', { mode: 'number' }).references(
            () => users.user_id
        ),
        event_ticket_id: bigint('event_ticket_id', { mode: 'number' })
            .references(() => eventTicket.id)
            .notNull(),
        transaction_id: text('transaction_id'),
        count: integer('count'),
        total_price: bigint('total_price', { mode: 'bigint' }),
        state: orderState('state'),
        failed_reason: text('failed_reason'),
        telegram: text('telegram').notNull(),
        full_name: text('full_name').notNull(),
        company: text('company').notNull(),
        position: text('position').notNull(),
        owner_address: text('owner_address').notNull(),
        created_at: timestamp('created_at').defaultNow(),
    },
    (table) => ({
        eventUuidIdx: index('event_uuid_idx').on(table.event_uuid),
        userIdIdx: index('user_id_idx').on(table.user_id),
        eventTicketIdIdx: index('event_ticket_id_idx').on(
            table.event_ticket_id
        ),
        transactionIdIdx: index('transaction_id_idx').on(table.transaction_id),
        stateIdx: index('state_idx').on(table.state),
        telegramIdx: index('telegram_idx').on(table.telegram),
        fullNameIdx: index('full_name_idx').on(table.full_name),
        companyIdx: index('company_idx').on(table.company),
        ownerAddressIdx: index('owner_address_idx').on(table.owner_address),
        createdAtIdx: index('created_at_idx').on(table.created_at),
    })
)

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
}))

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
}))

export const userRelations = relations(users, ({ many }) => ({
    userEventFields: many(userEventFields),
    airdropRoutines: many(airdropRoutines),
    tickets: many(tickets),
    orders: many(orders),
}))

export const eventFieldRelations = relations(eventFields, ({ one, many }) => ({
    event: one(events, {
        fields: [eventFields.event_id],
        references: [events.event_id],
    }),
    userEventFields: many(userEventFields),
}))

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
)

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
)
