import { db } from '@/db/db'
import { orders, tickets } from '@/db/schema'
import { removeKey } from '@/lib/utils'
import { getAuthenticatedUser } from '@/server/auth'
import { and, asc, eq, or, sql } from 'drizzle-orm'
import { type NextRequest } from 'next/server'

// TODO: fix the return type for the places that it is being used

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const eventId = params.id
    const searchParams = req.nextUrl.searchParams
    const dataOnly = searchParams.get('data_only') as 'true' | undefined

    // get event data using drizzle
    const unsafeEvent = await db.query.events.findFirst({
        where(fields, { eq }) {
            return (eq(fields.event_uuid, eventId))
        },
    })

    // error 400 if not found
    if (!unsafeEvent?.event_uuid) {
        return Response.json({ error: 'Event not found' }, { status: 400 })
    }

    const event = removeKey(unsafeEvent, 'secret_phrase')

    const organizer = await db.query.users.findFirst({
        where(fields, { eq }) {
            return eq(fields.user_id, event.owner as number)
        },
    })

    const ticket = event.ticketToCheckIn
        ? (
            await db.query.eventTicket.findFirst({
                where(fields, { eq }) {
                    return eq(fields.event_uuid, event.event_uuid as string)
                }
            }))
        : undefined

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

    // TODO: fix the typing here
    const isSoldOut = (soldTicketsCount[0].count) as unknown as number >= (ticket?.count as unknown as number)

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
        return Response.json({
            ...event,
            organizer,
            eventTicket: ticket,
            isSoldOut
        }, {
            status: 200,
        })
    }

    const [userId, unauthorized] = getAuthenticatedUser()

    if (unauthorized) {
        return unauthorized
    }

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
        userTicket,
        orderAlreadyPlace: !!userOrder,
        organizer,
        eventTicket: ticket,
        isSoldOut,
    }

    // return event data
    return Response.json(data, {
        status: 200,
    })
}

export const dynamic = 'force-dynamic'
