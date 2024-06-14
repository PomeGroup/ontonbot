import { db } from '@/db/db'
import { orders } from '@/db/schema'
import { NextRequest } from 'next/server'
import { z } from 'zod'

type OptionsProps = {
    params: {
        order_id: string
    }
}

export async function GET(_: NextRequest, { params }: OptionsProps) {
    const orderId = params.order_id

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

    return Response.json({
        ...order,
        nft_collection_address: order.eventTicket.collectionAddress,
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
})
export async function PATCH(req: NextRequest, { params }: OptionsProps) {
    const orderId = params.order_id

    const rawBody = req.json()
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

    await db.update(orders).set({
        state: body.data.state,
        transaction_id: body.data.transaction_id,
    })

    return Response.json({
        message: 'order updated',
    })
}

export const dynamic = 'force-dynamic'
