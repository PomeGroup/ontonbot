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
    const parsedData = buyTicketSchema.safeParse(await req.json())

    if (!parsedData.success) {
        return Response.json(
            {
                error: 'invalid data',
                errors: parsedData.error.flatten().fieldErrors,
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

    // check if user already has the ticket
    const userHasTicket = (
        await db
            .select()
            .from(tickets)
            .where(eq(tickets.user_id, parsedData.data.user_id))
            .where(eq(tickets.event_uuid, parsedData.data.event_id))
    ).pop()

    if (userHasTicket) {
        return Response.json(
            { error: 'User already owns a ticket' },
            { status: 400 }
        )
    }

    try {
        return await db.transaction(async (tx) => {
            // TODO: we should pass ticket_id ton function bellow
            await tx.insert(tickets).values({
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
            const res = await fetch(
                `${process.env.NFT_MANAGER_BASE_URL}/validateTrx`,
                {
                    method: 'POST',
                    body,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            )

            if (res.status !== 200) {
                tx.rollback()
            }

            return res
        })
    } catch (error) {
        return Response.json(
            {
                error: 'an error occurred while validating your transaction',
            },
            {
                status: 500,
            }
        )
    }
}
