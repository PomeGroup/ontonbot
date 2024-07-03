import { db } from '@/db/db'
import { events, eventTicket, orders, tickets, users } from '@/db/schema'
import { removeKey } from '@/lib/utils'
import { getAuthenticatedUser } from '@/server/auth'
import { and, asc, eq, or, sql } from 'drizzle-orm'
import { type NextRequest } from 'next/server'

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const eventId = params.id
    const searchParams = req.nextUrl.searchParams
    const dataOnly = searchParams.get('data_only') as 'true' | undefined

    if (dataOnly === 'true') {
        // get event data using drizzle
        const unsafeEvent = await db.query.events.findFirst({
            where(fields, { eq }) {
                return eq(fields.event_uuid, eventId)
            },
        })

        // error 400 if not found
        if (!unsafeEvent) {
            return Response.json({ error: 'Event not found' }, { status: 400 })
        }

        const event = removeKey(unsafeEvent, "secret_phrase")

        // return event data
        return Response.json(event, {
            status: 200,
        })
    }

    const [userId, unauthorized] = getAuthenticatedUser()

    if (unauthorized) {
        return unauthorized
    }

    // get event data using drizzle
    const unsafeEvent = (
        await db
            .select()
            .from(events)
            .where(eq(events.event_uuid, eventId))
            .execute()
    ).pop()


    // error 400 if not found
    if (!unsafeEvent?.event_uuid) {
        return Response.json({ error: 'Event not found' }, { status: 400 })
    }

    const event = removeKey(unsafeEvent, 'secret_phrase')

    const organizer = (
        await db
            .select()
            .from(users)
            .where(eq(users.user_id, event.owner as number))
            .execute()
    )[0]

    const ticket = event.ticketToCheckIn
        ? (
            await db
                .select()
                .from(eventTicket)
                .where(eq(eventTicket.event_uuid, event.event_uuid as string))
                .execute()
        )[0]
        : undefined

    const userTicket = (
        await db
            .select()
            .from(tickets)
            .where(
                and(
                    eq(tickets.event_uuid, event.event_uuid as string),
                    eq(tickets.user_id, userId)
                )
            )
            .orderBy(asc(tickets.created_at))
            .execute()
    ).pop()

    const soldTicketsCount = await db
        .select({ count: sql`count(*)`.mapWith(Number) })
        .from(orders)
        .where(
            and(
                eq(orders.event_uuid, event.event_uuid as string),
                or(
                    eq(orders.state, 'minted'),
                    eq(orders.state, 'created'),
                    eq(orders.state, 'mint_request')
                )
            )
        )
        .execute()

    const userOrder = (
        await db
            .select()
            .from(orders)
            .where(
                and(
                    eq(orders.user_id, userId),
                    eq(orders.event_ticket_id, ticket?.id as number),
                    or(
                        eq(orders.state, 'created'),
                        eq(orders.state, 'minted'),
                        eq(orders.state, 'mint_request')
                    )
                )
            )
            .execute()
    ).pop()

    const data = {
        ...event,
        eventTicket: ticket,
        organizer,
        userTicket,
        orderAlreadyPlace: !!userOrder,
        isSoldOut: soldTicketsCount[0].count === ticket?.count,
    }

    // return event data
    return Response.json(data, {
        status: 200,
    })
}

export const dynamic = 'force-dynamic'
