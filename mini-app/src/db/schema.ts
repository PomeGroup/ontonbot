import {
    bigint,
    boolean,
    integer,
    pgEnum,
    pgTable,
    serial,
    text,
    timestamp,
    unique,
    uuid,
} from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
    user_id: bigint('user_id', { mode: 'number' }).primaryKey(),
    username: text('username'),
    first_name: text('first_name'),
    last_name: text('last_name'),
    wallet_address: text('wallet_address'),
    language_code: text('language_code'),
    role: text('role'),
    created_at: timestamp('created_at').defaultNow(),
})

export const events = pgTable('events', {
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
    owner: bigint('owner', { mode: 'number' }).references(() => users.user_id),
    hidden: boolean('hidden').default(false),
    ticketToCheckIn: boolean('ticketToCheckIn').default(false),
    created_at: timestamp('created_at').defaultNow(),
})

export const eventFields = pgTable('event_fields', {
    id: serial('id').primaryKey(),
    emoji: text('emoji'),
    title: text('title'),
    description: text('description'),
    placeholder: text('placeholder'),
    type: text('type'),
    order_place: integer('order_place'),
    event_id: integer('event_id').references(() => events.event_id),
})

export const visitors = pgTable('visitors', {
    user_id: bigint('user_id', { mode: 'number' }).references(
        () => users.user_id
    ),
    event_uuid: uuid('event_uuid').references(() => events.event_uuid),
    claimed: integer('claimed'),
    amount: integer('amount'),
    tx_hash: text('tx_hash'),
    created_at: timestamp('created_at').defaultNow(),
})

export const userEventFields = pgTable(
    'user_event_fields',
    {
        id: serial('id').primaryKey(),
        event_field_id: serial('event_field_id').references(
            () => eventFields.id
        ),
        user_id: bigint('user_id', { mode: 'number' }).references(
            () => users.user_id
        ),
        data: text('data'),
        completed: boolean('completed'),
        created_at: timestamp('created_at').defaultNow(),
    },
    (table) => ({
        unq: unique().on(table.event_field_id, table.user_id),
    })
)

export const airdropRoutines = pgTable('airdrop_routines', {
    id: serial('id').primaryKey(),
    event_id: serial('event_id').references(() => events.event_id),
    user_id: bigint('user_id', { mode: 'number' }).references(
        () => users.user_id
    ),
    status: text('status'),
    created_at: timestamp('created_at').defaultNow(),
})

export const eventTicket = pgTable('event_tickets', {
    id: serial('id').primaryKey(),
    event_id: serial('event_id').references(() => events.event_id),
    title: text('title'),
    description: text('description'),
    price: integer('price'),
    count: integer('count'),
    created_at: timestamp('created_at').defaultNow(),
})

export const ticketStatus = pgEnum('event_ticket_status', ['USED', 'VALID'])
export const tickets = pgTable('tickets', {
    id: serial('id').primaryKey(),
    company: text('company'),
    status: ticketStatus('status'),
    nftAddress: text('nft_address'),
    event_id: serial('event_id').references(() => events.event_id),
    ticket_id: serial('event_ticket_id').references(() => eventTicket.id),
    user_id: bigint('user_id', { mode: 'number' }).references(
        () => users.user_id
    ),
    created_at: timestamp('created_at').defaultNow(),
})
