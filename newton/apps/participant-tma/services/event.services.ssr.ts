
import { cookies } from "next/headers";
import { env } from "~/env.mjs"
import { EventDataOnlyType, EventType } from "~/types/event.types"

export async function getEventDataOnly(
  id: string,
): Promise<EventDataOnlyType | null> {
  const eventResponse = await fetch(
    `${env.NEXT_PUBLIC_API_BASE_URL}/event/${id}?data_only=true`,
    {
      method: "GET",
      headers: {
        'x-api-key': env.ONTON_API_KEY
      }
    },
  );

  if (!eventResponse.ok) {
    return null;
  }

  const event: EventDataOnlyType = await eventResponse.json();

  return event;
}


// NOTE: use this inn server only
export async function getEventWithUserDataSSRAuth(id: string) {
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
    },
  );

  console.log({
    ok: eventResponse.ok,
    stat: eventResponse.status
  });


  if (!eventResponse.ok) {
    return undefined;
  }

  const event: EventType = await eventResponse.json();

  return event;
}

