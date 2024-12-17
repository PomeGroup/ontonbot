import { db } from "@/db/db";
import { orders, tickets } from "@/db/schema";
import { sendLogNotification } from "@/lib/tgBot";
import { apiKeyAuthentication, getAuthenticatedUser } from "@/server/auth";
import { Address } from "@ton/core";
import { eq, sql } from "drizzle-orm";
import { NextRequest } from "next/server";
import { z } from "zod";

type OptionsProps = {
  params: {
    order_id: string;
  };
};

export async function GET(req: NextRequest, { params }: OptionsProps) {
  return Response.json({});
  // const orderId = params.order_id;

  // const [, error] = getAuthenticatedUser();
  // const apiKeyError = apiKeyAuthentication(req);
  // if (error && apiKeyError) return error || apiKeyError;

  // const order = await db.query.orders.findFirst({
  //   where(fields, { eq }) {
  //     return eq(fields.uuid, orderId);
  //   },
  // });

  // if (!order) {
  //   return Response.json({ message: "order_not_found" }, { status: 404 });
  // }

  // const tickets = await db.query.tickets.findMany({
  //   where(fields, { eq }) {
  //     return eq(fields.order_uuid, order.uuid);
  //   },
  // });

  // // get event ticket and if not found return event ticket not found
  // const eventTicketData = await db.query.eventTicket.findFirst({
  //   where(fields, { eq }) {
  //     return eq(fields.id, order.event_ticket_id);
  //   },
  // });

  // if (!eventTicketData) return Response.json({ message: "event_ticket_not_found" }, { status: 404 });

  // return Response.json({
  //   ...order,
  //   total_price: BigInt(order.total_price as bigint).toString(),
  //   nft_collection_address: eventTicketData.collectionAddress,
  //   tickets,
  // });
}



export const dynamic = "force-dynamic";


