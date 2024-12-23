import { cookies } from "next/headers";

import { env } from "~/env.mjs";
import { TicketType } from "~/types/ticket.types";

export async function getTicketByEventUuid(event_uuid: string) {
  const userToken = cookies().get("token");

  if (userToken === undefined) {
    return null;
  }

  const eventResponse = await fetch(`${env.NEXT_PUBLIC_API_BASE_URL}/event/${event_uuid}/ticket`, {
    method: "GET",
    headers: {
      Cookie: `token=${userToken.value}`,
      "x-api-key": env.ONTON_API_KEY,
    },
  });

  if (!eventResponse.ok) {
    return null;
  }

  const event: TicketType = await eventResponse.json();

  return event;
}
