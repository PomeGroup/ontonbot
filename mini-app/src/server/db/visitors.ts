import { db } from '@/db/db'
import {
    eventFields,
    events,
    rewards,
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

export const selectValidVisitorById = async (visitorId: number) => {
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
        .leftJoin(users, eq(visitors.user_id, users.user_id))
        .leftJoin(events, eq(events.event_uuid, visitors.event_uuid))
        .where(
            and(
                eq(visitors.id, visitorId),
                isNotNull(events.start_date),
                isNotNull(events.end_date),
                isNotNull(users.wallet_address),
                between(
                    visitors.last_visit,
                    sql`TO_TIMESTAMP(events.start_date)`,
                    sql`TO_TIMESTAMP(events.end_date)`
                ),
                or(
                    sql`(select count(*) from event_fields where event_fields.event_id = events.event_id) = 0`,
                    sql`(select count(*) from user_event_fields uef left join event_fields ef on ef.id = uef.event_field_id where uef.user_id = users.user_id and events.event_id = ef.event_id and uef.completed=true) = (select count(*) from event_fields ef where ef.event_id = events.event_id)`
                )
            )
        )
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
        .leftJoin(users, eq(visitors.user_id, users.user_id))
        .leftJoin(rewards, eq(visitors.id, rewards.visitor_id))
        .where(and(isNotNull(rewards.id), eq(visitors.event_uuid, event_uuid)))

    if (typeof limit === 'number') {
        visitorsQuery = visitorsQuery.limit(limit)
    }

    if (typeof cursor === 'number') {
        visitorsQuery = visitorsQuery.offset(cursor)
    }

    const visitorsData = await visitorsQuery.execute()

    console.log('visitorsData', visitorsData.length)
    let userEventFieldsData = await db
        .select({
            user_id: userEventFields.user_id,
            event_field_id: userEventFields.event_field_id,
            data: userEventFields.data,
            title: eventFields.title,
        })
        .from(userEventFields)
        .leftJoin(
            eventFields,
            eq(userEventFields.event_field_id, eventFields.id)
        )
        .leftJoin(events, eq(eventFields.event_id, events.event_id))
        .where(eq(events.event_uuid, event_uuid))

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
        visitorsData,
        nextCursor,
    }
}

export async function updateVisitorLastVisitc(id: number) {
    return await db.update(visitors).set({
        last_visit: sql`now()`,
    })
}
