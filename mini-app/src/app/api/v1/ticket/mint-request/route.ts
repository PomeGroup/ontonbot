import { db } from '@/db/db'
import { eventTicket, tickets } from '@/db/schema'
import { Address } from '@ton/core'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

const buyTicketSchema = z.object({
    owner_address: z
        .string()
        .refine((v) => Address.isAddress(Address.parse(v))),
    boc: z.string(),
    telegram: z.string(),
    full_name: z.string(),
    event_id: z.string().uuid(),
    company: z.string().optional(),
    position: z.string().optional(),
    user_id: z.number(),
})

export async function POST(req: Request) {
    const parsedData = buyTicketSchema.safeParse(req.json())

    if (!parsedData.success) {
        return Response.json(
            {
                error: 'invalid data',
            },
            {
                status: 400,
            }
        )
    }
    const data = parsedData.data

    const eventTicketData = (
        await db
            .select()
            .from(eventTicket)
            .where(eq(eventTicket.event_uuid, data.event_id))
            .execute()
    ).pop()

    if (!eventTicketData) {
        return Response.json(
            { error: 'Event ticket data not found' },
            { status: 400 }
        )
    }

    // TODO: we should pass ticket_id ton function bellow
    await db.insert(tickets).values({
        name: data.full_name,
        company: data.company,
        position: data.position,
        event_uuid: data.event_id,
        telegram: data.telegram,
        ticket_id: eventTicketData?.id,
        user_id: data.user_id,
        status: 'UNUSED',
    })

    const body = JSON.stringify({
        exBoc: data.boc,
        participantAddress: data.owner_address,
        collectionAddress: eventTicketData.collectionAddress,
        ticketValue: eventTicketData.price,
    })

    // return the response returned by this fetch
    return await fetch(`${process.env.NFT_MANAGER_BASE_URL}/validateTrx`, {
        method: 'POST',
        body,
        headers: {
            'Content-Type': 'application/json',
        },
    })
}
