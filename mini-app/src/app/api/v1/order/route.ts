import { db } from '@/db/db'
import { orders } from '@/db/schema'
import { getAuthenticatedUser } from '@/server/auth'
import { toNano } from '@ton/core'
import { and, eq, sql } from 'drizzle-orm'
import { z } from 'zod'

const addOrderSchema = z.object({
    event_ticket_id: z.number(),
    // count: z.number(),
})

export async function POST(request: Request) {
    const [userId, error] = await getAuthenticatedUser()
    if (error) {
        return error
    }

    const rawBody = request.json()
    const body = addOrderSchema.safeParse(rawBody)

    if (!body.success) {
        return Response.json(body.error.flatten(), {
            status: 400,
        })
    }

    const eventTicket = await db.query.eventTicket.findFirst({
        where(fields, { eq }) {
            return eq(fields.id, body.data.event_ticket_id)
        },
    })

    const mintedTicketsCount = await db
        .select({ count: sql`count(*)`.mapWith(Number) })
        .from(orders)
        .where(
            and(
                eq(orders.event_ticket_id, body.data.event_ticket_id),
                eq(orders.state, 'minted')
            )
        )

    if (!eventTicket || !mintedTicketsCount.length) {
        return Response.json(
            {
                message: 'Event ticket does not exist',
            },
            {
                status: 400,
            }
        )
    }

    if (mintedTicketsCount[0].count >= (eventTicket.count || 0)) {
        return Response.json(
            {
                message: 'Event tickets are sold out',
            },
            {
                status: 401,
            }
        )
    }

    const new_order = (
        await db
            .insert(orders)
            .values({
                // TODO: change for multiple tickets
                count: 1,
                event_ticket_id: eventTicket.id,
                event_uuid: eventTicket.event_uuid,
                state: 'created',
                total_price: toNano(eventTicket.price),
                user_id: userId,
            })
            .returning()
    ).pop()

    return Response.json({
        order_id: new_order?.uuid,
        message: 'order created successfully',
    })
}
