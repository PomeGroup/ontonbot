import { env } from "~/env.mjs"
import { EventType } from "~/types/event.types"

// NOTE: use this inn client only
export async function getEventWithUserData(id: string, params: { proof_token: string }) {
  const searchParams = new URLSearchParams(params)

  const eventResponse = await fetch(
    `${env.NEXT_PUBLIC_API_BASE_URL_ONTON}/event/${id}?${searchParams.toString()}`,
    {
      method: "GET",
    },
  );

  console.log({
    ok: eventResponse.ok,
    stat: eventResponse.status
  });

  if (!eventResponse.ok) {
    return null;
  }

  const event: EventType = await eventResponse.json();

  return event;
}
