import { env } from "~/env.mjs";
import { CouponData, EventType } from "~/types/event.types";
import { RequestError } from "~/utils/custom-error";

// NOTE: use this inn client only
export async function getEventWithUserData(id: string, params: { proof_token: string }) {
  const searchParams = new URLSearchParams(params);

  const eventResponse = await fetch(`${env.NEXT_PUBLIC_API_BASE_URL}/event/${id}?${searchParams.toString()}`, {
    method: "GET",
  });

  if (!eventResponse.ok) {
    throw new RequestError({
      message: "Wallet session expired, Reconnect.",
      name: "REQUEST_401_ERROR",
    });
  }

  const event: EventType = await eventResponse.json();

  return event;
}

export async function checkCoupon(eventId: number, discountCode: string): Promise<CouponData> {
  const response = await fetch(`/api/v1/event/${eventId}/checkCoupon/${encodeURIComponent(discountCode)}`, {
    method: "GET",
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Invalid coupon code");
  }
  return (await response.json()).data;
}
