import { env } from "../../env.mjs";
import { GetOrderResponse } from "@/types/order.types";

export async function addOrder(body: {
  full_name: string;
  telegram: string;
  company: string;
  position: string;
  owner_address: string;
  event_ticket_id: number;
}) {
  const eventResponse = await fetch(`${env.NEXT_PUBLIC_API_BASE_URL}/order`, {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (!eventResponse.ok) {
    throw new Error("Add order failed");
  }

  const event: {
    order_id: string;
    message: string;
  } = await eventResponse.json();

  return event;
}

/**
 * Client Side Fetching (token cookie will be present)
 */
export async function getOrder({ order_id }: { order_id: string }) {
  if (!order_id) {
    return;
  }

  const eventResponse = await fetch(
    `${env.NEXT_PUBLIC_API_BASE_URL}/order/${order_id}`,
    {
      method: "GET",
    }
  );

  if (!eventResponse.ok) {
    throw new Error("Fetching order failed");
  }

  const event: GetOrderResponse = await eventResponse.json();

  return event;
}
