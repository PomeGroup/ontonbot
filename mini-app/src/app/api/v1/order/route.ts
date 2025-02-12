import { db } from "@/db/db";
import { eventRegistrants, orders } from "@/db/schema";
import { removeKey } from "@/lib/utils";
import { getAuthenticatedUser } from "@/server/auth";
import eventDB from "@/server/db/events";
import { Address } from "@ton/core";
import { and, count, eq, or } from "drizzle-orm";
import { z } from "zod";
import "@/lib/gracefullyShutdown";

const addOrderSchema = z.object({
  event_uuid: z.string().uuid(),
  full_name: z.string(),
  telegram: z.string(),
  company: z.string(),
  position: z.string(),
  utm: z.string().nullable(),
  owner_address: z.string().refine((data) => Address.isAddress(Address.parse(data))),
});

//create order if order for that event and user does not exist
//reactivate order with current price

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
  const eventData = await eventDB.fetchEventByUuid(body.data.event_uuid);
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

  /* -------------------------------------------------------------------------- */
  /*                   OrderType Based On Event Ticket Setting                  */
  /* -------------------------------------------------------------------------- */
  const eventTicketingType = eventPaymentInfo.ticket_type;

  const ticketOrderTypeMap = {
    NFT: "nft_mint",
    TSCSBT: "ts_csbt_ticket",
  } as const;

  // Ensure TypeScript recognizes the valid key
  const ticketOrderType = ticketOrderTypeMap[eventTicketingType];

  /* -------------------------------------------------------------------------- */
  /*                                      ⬆                                     */
  /* -------------------------------------------------------------------------- */

  /* -------------------------------------------------------------------------- */
  /*                               Sold Out Check                               */
  /* -------------------------------------------------------------------------- */
  const TicketsCount = await db
    .select({ ticket_count: count() })
    .from(orders)
    .where(
      and(
        eq(orders.event_uuid, body.data.event_uuid),
        or(eq(orders.state, "completed"), eq(orders.state, "processing")),
        eq(orders.order_type, ticketOrderType)
      )
    )
    .execute();

  if (TicketsCount[0].ticket_count >= (eventData.capacity || 0)) {
    return Response.json(
      {
        message: "Event tickets are sold out",
      },
      {
        status: 410,
      }
    );
  }
  /* -------------------------------------------------------------------------- */
  /*                                      ⬆                                     */
  /* -------------------------------------------------------------------------- */

  const userOrder = await db.query.orders.findFirst({
    where: and(
      eq(orders.user_id, userId),
      eq(orders.order_type, ticketOrderType),
      eq(orders.event_uuid, eventData.event_uuid)
    ),
  });

  /* -------------------------------------------------------------------------- */
  /*                            Already Have an Order                           */
  /* -------------------------------------------------------------------------- */
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
        total_price: userOrder.total_price,
      });
    }

    if (userOrder.state === "new" || userOrder.state === "confirming") {
      await db
        .update(orders)
        .set({ state: "new", updatedAt: new Date(), total_price: eventPaymentInfo.price }) //TODO - Apply Coupon Here
        .where(eq(orders.uuid, userOrder.uuid))
        .execute();
      return Response.json({
        order_id: userOrder.uuid,
        message: "order is placed",
        payment_type: userOrder.payment_type,
        total_price: userOrder.total_price,
      });
    }
  }

  let new_order = null;
  let new_order_uuid = null;
  let new_order_price = -1;

  /* -------------------------------------------------------------------------- */
  /*                              Create New Order                              */
  /* -------------------------------------------------------------------------- */
  await db.transaction(async (trx) => {
    //TODO - Apply Coupon Here
    new_order = (
      await trx
        .insert(orders)
        .values({
          event_uuid: body.data.event_uuid,
          user_id: userId,

          total_price: eventPaymentInfo.price,
          payment_type: eventPaymentInfo.payment_type,

          state: "confirming",
          order_type: ticketOrderType,

          utm_source: body.data.utm,
          updatedBy: "system",
        })
        .returning()
        .execute()
    ).pop();

    new_order_price = new_order?.total_price || -1;

    const register_info = removeKey(body.data, "event_uuid");
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
      total_price: new_order_price,
    });
  } else {
    return Response.json({
      message: "failed to insert the order",
    });
  }
}

export const dynamic = "force-dynamic";
