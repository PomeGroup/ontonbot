import { db } from '@/db/db'
import { events } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(_: Request, { params }: { params: { id: string } }) {
    const eventId = parseInt(params.id)

    if (isNaN(eventId)) {
        return Response.json({ error: 'Invalid event ID' }, { status: 400 })
    }

    // get event data using drizzle
    const data = await db
        .select()
        .from(events)
        .where(eq(events.event_id, eventId))
        .execute()

    // error 400 if not found
    if (data.length === 0) {
        return Response.json({ error: 'Event not found' }, { status: 400 })
    }

    // return event data
    return Response.json(data[0], {
        status: 200,
    })
}
