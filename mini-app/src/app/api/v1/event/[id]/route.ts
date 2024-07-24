import { db } from '@/db/db'
import { orders, tickets } from '@/db/schema'
import { removeKey } from '@/lib/utils'
import { getAuthenticatedUser } from '@/server/auth'
import { and, asc, eq, or, sql } from 'drizzle-orm'
import { type NextRequest } from 'next/server'

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const eventId = params.id
        const searchParams = req.nextUrl.searchParams
        const dataOnly = searchParams.get('data_only') as 'true' | undefined

        const unsafeEvent = await db.query.events.findFirst({
            where(fields, { eq }) {
                return (eq(fields.event_uuid, eventId))
            },
        })

        if (!unsafeEvent?.event_uuid) {
            return Response.json({ error: 'Event not found' }, { status: 400 })
        }

        const event = removeKey(unsafeEvent, 'secret_phrase')

        const organizer = await db.query.users.findFirst({
            where(fields, { eq }) {
                return eq(fields.user_id, event.owner as number)
            },
        })

        if (!organizer) {
            console.error(`Organizer not found for event ID: ${eventId}`)
            return Response.json({ error: `Organizer not found for event ID: ${eventId}` }, { status: 400 })
        }

        let ticket
        if (event.ticketToCheckIn) {
            ticket = await db.query.eventTicket.findFirst({
                where(fields, { eq }) {
                    return eq(fields.event_uuid, event.event_uuid as string)
                }
            })
            if (!ticket) {
                console.warn(`Ticket not found for event ID: ${eventId}`)
            }
        }

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

        const isSoldOut = (soldTicketsCount[0].count as unknown as number) >= (ticket?.count as unknown as number)

        if (dataOnly === 'true') {
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
            console.warn(`Unauthorized access attempt for event ID: ${eventId}`)
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

        return Response.json(data, {
            status: 200,
        })
    } catch (error) {
        console.error(`Error processing request for event ID: ${params.id}`, error)
        return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export const dynamic = 'force-dynamic'
