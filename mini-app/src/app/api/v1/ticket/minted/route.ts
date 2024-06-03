import { db } from '@/db/db'
import { tickets } from '@/db/schema'
import { Address } from '@ton/core'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

const ticketMintedSchema = z.object({
    ticket_id: z.number(),
    nft_address: z.string().refine((v) => Address.isAddress(Address.parse(v))),
})

export async function POST(req: Request) {
    const body = await req.json()
    const parsedData = ticketMintedSchema.safeParse(body)

    if (!parsedData.success) {
        return Response.json(
            { error: 'invalid userid' },
            {
                status: 400,
            }
        )
    }

    await db
        .update(tickets)
        .set({
            status: 'USED',
            nftAddress: parsedData.data.nft_address,
        })
        .where(eq(tickets.id, parsedData.data.ticket_id))
        .execute()

    return Response.json({ message: 'user ticked minted' })
}
