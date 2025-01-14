import { db } from "@/db/db";
import { eventRegistrants, orders } from "@/db/schema";
import { getAuthenticatedUser } from "@/server/auth";
import { selectEventByUuid } from "@/server/db/events";
import { Address } from "@ton/core";
import { and, eq, or, sql } from "drizzle-orm";
import { z } from "zod";

const addOrderSchema = z.object({
  event_uuid: z.string().uuid(),
  full_name: z.string(),
  telegram: z.string(),
  company: z.string(),
  position: z.string(),
  utm: z.string().nullable(),
  owner_address: z.string().refine((data) => Address.isAddress(Address.parse(data))),
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
  const eventData = await selectEventByUuid(body.data.event_uuid);
  if (!eventData) {
    return Response.json({ message: "event not found" }, { status: 400 });
  }

  const eventPaymentInfo = await db.query.eventPayment.findFirst({
    where(fields, { eq }) {
      return eq(fields.event_uuid, body.data.event_uuid);
    },
  });

  if (!eventPaymentInfo) {
    return Response.json(
      {
        message: "Event payment info does not exist",
      },
      {
        status: 404,
      }
    );
  }

  const userOrder = (
    await db
      .select()
      .from(orders)
      .where(and(eq(orders.user_id, userId), eq(orders.order_type, "nft_mint"), eq(orders.event_uuid, eventData.event_uuid)))
      .execute()
  ).pop();

  if (userOrder) {
    if (userOrder.state === "failed" || userOrder.state === "cancelled") {
      // Reactivate Order
      await db
        .update(orders)
        .set({ state: "new", updatedAt: new Date(), total_price: eventPaymentInfo.price })
        .where(eq(orders.uuid, userOrder.uuid))
        .execute();
      return Response.json({
        order_id: userOrder.uuid,
        message: "order reactivated successfully",
        payment_type: userOrder.payment_type,
        utm_tag: body.data.utm,
      });
    }

    if (userOrder.state === "new" || userOrder.state === "confirming") {
      await db
        .update(orders)
        .set({ state: "new", updatedAt: new Date(), total_price: eventPaymentInfo.price })
        .where(eq(orders.uuid, userOrder.uuid))
        .execute();
      return Response.json({
        order_id: userOrder.uuid,
        message: "order is placed",
        payment_type: userOrder.payment_type,
      });
    }
  }
  const TicketsCount = await db
    .select({ count: sql`count(*)`.mapWith(Number) })
    .from(orders)
    .where(
      and(
        eq(orders.event_uuid, body.data.event_uuid),
        or(eq(orders.state, "completed"), eq(orders.state, "processing")),
        eq(orders.order_type, "nft_mint")
      )
    )
    .execute();

  if (TicketsCount[0].count >= (eventData.capacity || 0)) {
    return Response.json(
      {
        message: "Event tickets are sold out",
      },
      {
        status: 410,
      }
    );
  }

  let new_order = undefined;
  let new_order_uuid = undefined;
  await db.transaction(async (trx) => {
    new_order = (
      await trx
        .insert(orders)
        .values({
          // TODO: change for multiple tickets
          event_uuid: body.data.event_uuid,
          user_id: userId,

          total_price: eventPaymentInfo.price,
          payment_type: eventPaymentInfo.payment_type,

          state: "confirming",
          order_type: "nft_mint",

          utm_source: body.data.utm,
          updatedBy: "system",
        })
        .returning()
        .execute()
    ).pop();

    // const user_registrant = await trx
    //   .select()
    //   .from(eventRegistrants)
    //   .where(and(eq(eventRegistrants.event_uuid, body.data.event_uuid), eq(eventRegistrants.user_id, userId)))
    //   .execute();

    const { event_uuid, ...register_info } = body.data;
    await trx
      .insert(eventRegistrants)
      .values({
        event_uuid: body.data.event_uuid,
        status: "pending",
        register_info: register_info,
        user_id: userId,
      })
      .onConflictDoUpdate({
        target: [eventRegistrants.event_uuid, eventRegistrants.user_id],
        set: {
          status: "pending",
          register_info: register_info,
        },
      })
      .execute();

    new_order_uuid = new_order?.uuid;
  });

  if (new_order && new_order_uuid) {
    return Response.json({
      order_id: new_order_uuid,
      message: "order created successfully",
      utm_tag: body.data.utm,
      payment_type: eventPaymentInfo.payment_type,
    });
  } else {
    return Response.json({
      message: "failed to insert the order",
    });
  }
}

export const dynamic = "force-dynamic";
