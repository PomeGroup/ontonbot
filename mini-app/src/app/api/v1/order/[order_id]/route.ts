import { db } from '@/db/db'
import { orders, tickets } from '@/db/schema'
import { apiKeyAuthentication, getAuthenticatedUser } from '@/server/auth'
import { Address } from '@ton/core'
import { eq } from 'drizzle-orm'
import { NextRequest } from 'next/server'
import { z } from 'zod'

type OptionsProps = {
    params: {
        order_id: string
    }
}

export async function GET(req: NextRequest, { params }: OptionsProps) {
    const orderId = params.order_id

    const [, error] = getAuthenticatedUser()
    const apiKeyError = apiKeyAuthentication(req)
    console.log({ apiKeyError })
    if (error && apiKeyError) return error || apiKeyError

    const order = await db.query.orders.findFirst({
        where(fields, { eq }) {
            return eq(fields.uuid, orderId)
        },
        with: {
            eventTicket: true,
        },
    })

    if (!order || !order.eventTicket?.collectionAddress) {
        return Response.json({ message: 'order_not_found' }, { status: 404 })
    }

    const tickets = await db.query.tickets.findMany({
        where(fields, { eq }) {
            return eq(fields.order_uuid, order.uuid)
        },
    })

    return Response.json({
        ...order,
        total_price: BigInt(order.total_price as bigint).toString(),
        nft_collection_address: order.eventTicket.collectionAddress,
        tickets,
    })
}

// Continue from here
const patchOrderBodySchema = z.object({
    state: z.enum([
        'created',
        'mint_request',
        'minted',
        'failed',
        'validation_failed',
    ]),
    transaction_id: z.string().uuid().optional(),
    nft_address: z
        .string()
        .refine((d) => Address.isAddress(Address.parse(d)))
        .optional(),
})
export async function PATCH(req: NextRequest, { params }: OptionsProps) {
    const orderId = params.order_id

    const rawBody = await req.json()
    const body = patchOrderBodySchema.safeParse(rawBody)

    if (!body.success) {
        return Response.json(
            { message: 'invalid body' },
            {
                status: 400,
            }
        )
    }

    const order = await db.query.orders.findFirst({
        where(fields, { eq }) {
            return eq(fields.uuid, orderId)
        },
    })

    if (!order) {
        return Response.json({ message: 'ordernot found' }, { status: 404 })
    }

    await db.transaction(async (tx) => {
        try {
            if (body.data.state === 'minted') {
                await tx.insert(tickets).values({
                    company: order.company,
                    name: order.full_name,
                    telegram: order.telegram,
                    status: 'UNUSED',
                    position: order.position,
                    user_id: order.user_id,
                    order_uuid: order.uuid,
                    event_uuid: order.event_uuid,
                    ticket_id: order.event_ticket_id,
                    nftAddress: body.data.nft_address,
                })
            }

            await db
                .update(orders)
                .set({
                    state: body.data.state,
                    transaction_id: body.data.transaction_id,
                })
                .where(eq(orders.uuid, order.uuid))
            return
        } catch (error) {
            tx.rollback()
        }
    })

    return Response.json({
        message: 'order updated',
    })
}

export const dynamic = 'force-dynamic'
