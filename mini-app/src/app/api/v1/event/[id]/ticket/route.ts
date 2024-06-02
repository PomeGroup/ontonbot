import { db } from '@/db/db'
import { tickets } from '@/db/schema'
import { getAuthenticatedUser } from '@/server/auth'
import { eq } from 'drizzle-orm'

export async function GET(_: Request, { params }: { params: { id: string } }) {
    const eventId = params.id

    const [userId, unauthorized] = getAuthenticatedUser()

    if (unauthorized) {
        return unauthorized
    }

    const ticket = (
        await db
            .select()
            .from(tickets)
            .where(eq(tickets.event_uuid, eventId))
            .where(eq(tickets.user_id, userId))
            .execute()
    )[0]

    if (!ticket) {
        // ticket not found error
        return Response.json({ error: 'Ticket not found' }, { status: 400 })
    }

    return Response.json({ ticket })
}
