import { db } from '@/db/db'
import { events, eventTicket, users } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(_: Request, { params }: { params: { id: string } }) {
    const eventId = params.id

    // get event data using drizzle
    const event = await db
        .select()
        .from(events)
        .where(eq(events.event_uuid, eventId))
        .execute()

    // error 400 if not found
    if (event.length === 0) {
        return Response.json({ error: 'Event not found' }, { status: 400 })
    }

    const organizer = (
        await db
            .select()
            .from(users)
            .where(eq(users.user_id, event[0].owner as number))
            .execute()
    )[0]

    const ticket = event[0].ticketToCheckIn
        ? (
              await db
                  .select()
                  .from(eventTicket)
                  .where(eq(eventTicket.event_id, event[0].event_id))
                  .execute()
          )[0]
        : undefined

    const data = {
        ...event[0],
        eventTicket: ticket,
        organizer,
    }

    // return event data
    return Response.json(data, {
        status: 200,
    })
}

export const dynamic = 'force-dynamic'
