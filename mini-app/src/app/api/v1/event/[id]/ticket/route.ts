import { db } from "@/db/db";
import { eventPayment, eventRegistrants, tickets } from "@/db/schema";
import { getAuthenticatedUser } from "@/server/auth";
import { and, eq, desc, or } from "drizzle-orm";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const event_uuid = params.id;
  // return Response.json({})
  const [userId, unauthorized] = getAuthenticatedUser();

  if (unauthorized) {
    return unauthorized;
  }

  // const ticket = (
  //   await db
  //     .select()
  //     .from(tickets)
  //     .where(and(eq(tickets.event_uuid, event_uuid), eq(tickets.user_id, userId), eq(tickets.status, "UNUSED")))
  //     .orderBy(desc(tickets.updatedAt))

  //     .execute()
  // ).pop();

  const registrant = await db
    .select()
    .from(eventRegistrants)
    .where(
      and(
        or(eq(eventRegistrants.status, "approved"), eq(eventRegistrants.status, "checkedin")),
        eq(eventRegistrants.event_uuid, event_uuid),
        eq(eventRegistrants.user_id, userId)
      )
    )
    .execute();

  const user_registration = registrant.pop();

  if (!user_registration) {
    // ticket not found error
    return Response.json({ error: `User (${userId}) not found for event ${event_uuid}` }, { status: 404 });
  }

  const eventPaymentinfo = (
    await db.select().from(eventPayment).where(eq(eventPayment.event_uuid, event_uuid)).execute()
  ).pop();

  if (!eventPaymentinfo) {
    // ticket not found error
    return Response.json({ error: "Ticket data not found" }, { status: 400 });
  }

  const ticket = {
    ...user_registration,
  };

  const data = {
    ...ticket,
    nft_address: "nft_address",
    order_uuid: user_registration.registrant_uuid,
    ticketData: eventPaymentinfo,
    ...JSON.parse(String(user_registration.register_info)),
  };

  return Response.json(data);
}
