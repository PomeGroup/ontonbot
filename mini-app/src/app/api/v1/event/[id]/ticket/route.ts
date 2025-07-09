import { db } from "@/db/db";
import { eventPayment, eventRegistrants, nftItems, orders, rewards } from "@/db/schema";
import "@/lib/gracefullyShutdown";
import { getAuthenticatedUser } from "@/server/auth";
import { and, eq, or } from "drizzle-orm";

export async function GET(_: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const event_uuid = params.id;
  const [userId, unauthorized] = await getAuthenticatedUser();

  if (unauthorized) {
    return unauthorized;
  }

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
  const nft_address = (
    await db
      .select()
      .from(nftItems)
      .where(and(eq(nftItems.event_uuid, event_uuid), eq(nftItems.owner, userId)))
      .execute()
  ).pop()?.nft_address;

  const register_info_object =
    typeof user_registration.register_info === "object"
      ? user_registration.register_info
      : JSON.parse(String(user_registration.register_info || "{}"));

  let userSbtTicket;
  if (eventPaymentinfo?.ticket_type === "TSCSBT") {
    const visitor = await db.query.visitors.findFirst({
      where: and(eq(orders.user_id, userId), eq(orders.event_uuid, event_uuid)),
    });

    if (visitor) {
      userSbtTicket = await db.query.rewards.findFirst({
        where: and(eq(rewards.visitor_id, visitor.id), eq(rewards.type, "ton_society_csbt_ticket")),
      });
    }
  }

  const data = {
    ...user_registration,
    nftAddress: nft_address,
    order_uuid: user_registration.registrant_uuid,
    ticketData: eventPaymentinfo,
    ...register_info_object,
    userSbtTicket,
  };

  return Response.json(data);
}

export const dynamic = "force-dynamic";
