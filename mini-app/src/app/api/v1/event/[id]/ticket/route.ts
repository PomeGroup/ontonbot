import { db } from "@/db/db";
import { eventTicket, tickets } from "@/db/schema";
import { getAuthenticatedUser } from "@/server/auth";
import { and, eq, or } from "drizzle-orm";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const eventId = params.id;

  const [userId, unauthorized] = getAuthenticatedUser();

  if (unauthorized) {
    return unauthorized;
  }

  const ticket = (
    await db
      .select()
      .from(tickets)
      .where(
        or(
          and(eq(tickets.order_uuid, eventId), eq(tickets.user_id, userId)),
          and(eq(tickets.event_uuid, eventId), eq(tickets.user_id, userId)),
          ...[
            isNaN(parseInt(eventId))
              ? undefined
              : and(
                  eq(tickets.id, parseInt(eventId)),
                  eq(tickets.user_id, userId)
                ),
          ]
        )
      )

      .execute()
  ).pop();

  if (!ticket) {
    // ticket not found error
    return Response.json({ error: "Ticket not found" }, { status: 404 });
  }

  const eventTicketData = (
    await db
      .select()
      .from(eventTicket)
      .where(eq(eventTicket.id, ticket.ticket_id))
      .execute()
  ).pop();

  if (!eventTicketData) {
    // ticket not found error
    return Response.json({ error: "Ticket data not found" }, { status: 400 });
  }
  const data = {
    ...ticket,
    ticketData: eventTicketData,
  };

  return Response.json(data);
}
