import { db } from '@/db/db'
import { events, eventTicket, users } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(_: Request, { params }: { params: { id: string } }) {
    const eventId = params.id

    // get event data using drizzle
    const event = (
        await db
            .select()
            .from(events)
            .where(eq(events.event_uuid, eventId))
            .execute()
    ).pop()

    // error 400 if not found
    if (!event) {
        return Response.json({ error: 'Event not found' }, { status: 400 })
    }

    const organizer = (
        await db
            .select()
            .from(users)
            .where(eq(users.user_id, event.owner as number))
            .execute()
    )[0]

    const ticket = event.ticketToCheckIn
        ? (
              await db
                  .select()
                  .from(eventTicket)
                  .where(eq(eventTicket.event_uuid, event.event_uuid as string))
                  .execute()
          )[0]
        : undefined

    const data = {
        ...event,
        eventTicket: ticket,
        organizer,
    }

    // return event data
    return Response.json(data, {
        status: 200,
    })
}

export const dynamic = 'force-dynamic'
