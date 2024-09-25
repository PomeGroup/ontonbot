import { cookies } from "next/headers";

import { env } from "../../env.mjs";
import { EventDataOnlyType, EventType } from "@/types/event.types";

// Function overloads
export async function getEventData(_id: string): Promise<EventType | null>;
export async function getEventData(
  _id: string,
  _noAuth: true
): Promise<EventDataOnlyType | undefined>;
export async function getEventData(
  id: string,
  noAuth?: boolean
): Promise<EventType | EventDataOnlyType | null | undefined> {
  if (noAuth) {
    const eventResponse = await fetch(
      `${env.NEXT_PUBLIC_API_BASE_URL}/event/${id}?data_only=true`,
      {
        method: "GET",
        headers: {
          "x-api-key": env.ONTON_API_KEY,
        },
      }
    );

    if (!eventResponse.ok) {
      return;
    }

    const event: EventDataOnlyType = await eventResponse.json();

    return event;
  }

  const userToken = cookies().get("token");

  if (userToken === undefined) {
    return null;
  }

  const eventResponse = await fetch(
    `${env.NEXT_PUBLIC_API_BASE_URL}/event/${id}`,
    {
      method: "GET",
      headers: {
        Cookie: `token=${userToken.value}`,
      },
    }
  );

  console.log({
    ok: eventResponse.ok,
    stat: eventResponse.status,
  });

  if (!eventResponse.ok) {
    return undefined;
  }

  const event: EventType = await eventResponse.json();

  return event;
}
