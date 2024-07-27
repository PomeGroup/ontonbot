import { db } from '@/db/db'
import {
    eventFields,
    events,
    userEventFields,
    users,
    visitors,
} from '@/db/schema'
import { and, between, eq, isNotNull, isNull, or, sql } from 'drizzle-orm'

const generateRandomVisitor = (userId: number) => ({
    user_id: userId,
    username: `user_${userId}`,
    first_name: `FirstName${userId}`,
    last_name: `LastName${userId}`,
    wallet_address: `0x${Math.random().toString(36).substring(2, 15)}`,
    created_at: new Date().toISOString(),
    dynamicFields: [
        {
            event_field_id: Math.trunc(Math.random() * 10000),
            data: `Sample data ${userId}`,
        },
    ],
})

export const selectVisitorsByEventUuidMock = async (
    event_uuid: string,
    limit: number,
    cursor: number
) => {
    const visitorsData = Array.from({ length: limit }, (_, index) =>
        generateRandomVisitor(cursor + index + 1)
    )

    const moreRecordsAvailable = visitorsData.length === limit // Simulate the possibility of more records

    return {
        visitorsWithDynamicFields: visitorsData,
        moreRecordsAvailable,
        nextCursor: moreRecordsAvailable ? cursor + limit : null,
    }
}

export const selectVisitorById = async (visitorId: number) => {
    return await db
        .select({
            user_id: visitors.user_id,
            username: users.username,
            first_name: users.first_name,
            last_name: users.last_name,
            wallet_address: users.wallet_address,
            created_at: visitors.created_at,
        })
        .from(visitors)
        .fullJoin(users, eq(visitors.user_id, users.user_id))
        .fullJoin(events, eq(events.event_uuid, visitors.event_uuid))
        .leftJoin(
            eventFields,
            and(
                eq(eventFields.title, 'secret_phrase_onton_input'),
                eq(eventFields.id, events.event_id),
                // eq(eventFields.description, 'Enter the secret phrase')
            )
        )
        .where(
            and(
                eq(visitors.id, visitorId),
                isNotNull(events.start_date),
                isNotNull(events.end_date),
                isNotNull(users.wallet_address),
                between(
                    visitors.created_at,
                    sql`TO_TIMESTAMP(events.start_date)`,
                    sql`TO_TIMESTAMP(events.end_date)`
                ),
                or(
                    sql`(select count(*) from event_fields where event_fields.event_id = events.event_id) = 0`,
                    sql`(select count(*) from user_event_fields uef join event_fields ef on ef.id = uef.event_field_id where uef.user_id = users.user_id and events.event_id = ef.event_id) = (select count(*) from event_fields ef where ef.event_id = events.event_id)`
                ),
                or(
                    eq(events.secret_phrase, ''),
                    isNull(events.secret_phrase),
                    // the user entered event field for pass phrase should be eq to events.secret_phrase
                    sql`EXISTS (
                        SELECT 1
                        FROM user_event_fields uef
                        JOIN event_fields ef ON ef.id = uef.event_field_id
                        WHERE uef.user_id = users.user_id
                          AND ef.event_id = events.event_id
                          AND ef.title = 'secret_phrase_onton_input'
                          AND uef.data = events.secret_phrase
                    )`
                )
            )
        )
        .execute()
}

export const selectVisitorsByEventUuid = async (
    event_uuid: string,
    limit?: number,
    cursor?: number
) => {
    let visitorsQuery = db
        .select({
            user_id: visitors.user_id,
            username: users.username,
            first_name: users.first_name,
            last_name: users.last_name,
            wallet_address: users.wallet_address,
            created_at: visitors.created_at,
        })
        .from(visitors)
        .fullJoin(users, eq(visitors.user_id, users.user_id))
        .fullJoin(events, eq(visitors.event_uuid, event_uuid))
        .leftJoin(
            eventFields,
            and(
                eq(eventFields.title, 'secret_phrase_onton_input'),
                eq(eventFields.id, events.event_id),
                eq(eventFields.description, 'Enter the secret phrase')
            )
        )
        .where(
            and(
                eq(visitors.event_uuid, event_uuid),
                isNotNull(events.start_date),
                isNotNull(events.end_date),
                isNotNull(users.wallet_address),
                between(
                    visitors.created_at,
                    sql`TO_TIMESTAMP(events.start_date)`,
                    sql`TO_TIMESTAMP(events.end_date)`
                ),
                or(
                    sql`(select count(*) from event_fields where event_fields.event_id = events.event_id) = 0`,
                    sql`(select count(*) from user_event_fields uef join event_fields ef on ef.id = uef.event_field_id where uef.user_id = users.user_id and events.event_id = ef.event_id) = (select count(*) from event_fields ef where ef.event_id = events.event_id)`
                ),
                or(
                    eq(events.secret_phrase, ''),
                    isNull(events.secret_phrase),
                    // the user entered event field for pass phrase should be eq to events.secret_phrase
                    sql`EXISTS (
                        SELECT 1
                        FROM user_event_fields uef
                        JOIN event_fields ef ON ef.id = uef.event_field_id
                        WHERE uef.user_id = users.user_id
                          AND ef.event_id = events.event_id
                          AND ef.title = 'secret_phrase_onton_input'
                          AND uef.data = events.secret_phrase
                    )`
                )
            )
        )

    if (typeof limit === 'number') {
        visitorsQuery = visitorsQuery.limit(limit)
    }

    if (typeof cursor === 'number') {
        visitorsQuery = visitorsQuery.offset(cursor)
    }

    const visitorsData = await visitorsQuery.execute()

    let userEventFieldsData = await db
        .select({
            user_id: userEventFields.user_id,
            event_field_id: userEventFields.event_field_id,
            data: userEventFields.data,
            title: eventFields.title,
        })
        .from(userEventFields)
        .fullJoin(
            eventFields,
            eq(userEventFields.event_field_id, eventFields.id)
        )
        .fullJoin(events, eq(eventFields.event_id, events.event_id))
        .where(eq(events.event_uuid, event_uuid))
        .execute()

    const visitorsWithDynamicFields = visitorsData.map((visitor) => {
        const dynamicFields = userEventFieldsData
            .filter((field) => field.user_id === visitor.user_id)
            .map((field) => ({
                event_field_id: field.event_field_id,
                data: field.data,
            }))

        return {
            ...visitor,
            dynamicFields,
        }
    })

    const moreRecordsAvailable =
        typeof limit === 'number' ? visitorsData.length === limit : false
    const nextCursor =
        moreRecordsAvailable && typeof cursor === 'number'
            ? cursor + limit!
            : null

    return {
        visitorsWithDynamicFields,
        moreRecordsAvailable,
        nextCursor,
    }
}
