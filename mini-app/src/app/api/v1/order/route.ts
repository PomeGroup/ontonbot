import { db } from "@/db/db";
import { orders } from "@/db/schema";
import { getAuthenticatedUser } from "@/server/auth";
import { Address, toNano } from "@ton/core";
import { and, eq, lt, or, sql } from "drizzle-orm";
import { z } from "zod";

const addOrderSchema = z.object({
  event_ticket_id: z.number(),
  // count: z.number(),
  // form fields
  full_name: z.string(),
  telegram: z.string(),
  company: z.string(),
  position: z.string(),
  owner_address: z
    .string()
    .refine((data) => Address.isAddress(Address.parse(data))),
});

export async function POST(request: Request) {
  const [userId, error] = getAuthenticatedUser();
  if (error) {
    return error;
  }

  const rawBody = await request.json();

  const body = addOrderSchema.safeParse(rawBody);

  if (!body.success) {
    return Response.json(body.error.flatten(), {
      status: 400,
    });
  }

  // Parse the URL
  const url = new URL(request.url);
  
  // Access the `utm` parameter (e.g., utm_campaign, utm_source, etc.)
  const utmCampaign = url.searchParams.get('utm_campaign') || null;
  const utmSource = url.searchParams.get('utm_source') || null;

  

  const eventTicket = await db.query.eventTicket.findFirst({
    where(fields, { eq }) {
      return eq(fields.id, body.data.event_ticket_id);
    },
  });

  const mintedTicketsCount = await db
    .select({ count: sql`count(*)`.mapWith(Number) })
    .from(orders)
    .where(
      and(
        eq(orders.event_ticket_id, body.data.event_ticket_id),
        or(
          eq(orders.state, "minted"),
          eq(orders.state, "created"),
          eq(orders.state, "mint_request")
        )
      )
    )
    .execute();

  if (!eventTicket || !mintedTicketsCount.length) {
    return Response.json(
      {
        message: "Event ticket does not exist",
      },
      {
        status: 404,
      }
    );
  }

  const userOrder = await db.query.orders.findFirst({
    where(fields, { eq, and, or }) {
      return and(
        eq(fields.user_id, userId),
        eq(fields.event_ticket_id, eventTicket.id),
        or(
          eq(fields.state, "created"),
          eq(fields.state, "minted"),
          eq(fields.state, "mint_request")
        )
      );
    },
  });

  if (userOrder) {
    return Response.json(
      {
        message: "An order is already being proccessed",
      },
      {
        status: 409,
      }
    );
  }

  if (mintedTicketsCount[0].count >= (eventTicket.count || 0)) {
    return Response.json(
      {
        message: "Event tickets are sold out",
      },
      {
        status: 410,
      }
    );
  }

  const new_order = (
    await db
      .insert(orders)
      .values({
        // TODO: change for multiple tickets
        count: 1,
        event_uuid: eventTicket.event_uuid,
        state: "created",
        total_price: toNano(eventTicket.price),
        user_id: userId,
        ...body.data,
        updatedBy: "system",
      })
      .returning()
  ).pop();

  return Response.json({
    order_id: new_order?.uuid,
    message: "order created successfully",
    utmSource,
    utmCampaign
  });
}

/**
 *  update orders that are older than 5min at created state to failed state
 */
export async function PATCH() {
  await db
    .update(orders)
    .set({
      state: "failed",
      updatedBy: "system",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(orders.state, "created"),
        lt(orders.created_at, new Date(Date.now() - 1000 * 60 * 10))
      )
    );

  return Response.json({
    message: "orders updated",
  });
}

export const dynamic = "force-dynamic";
