import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getEventDataOnly } from "./services/event.services.ssr";

export async function middleware(req: NextRequest) {
  try {
    const tgAppStartParam = req.nextUrl.searchParams.get("tgWebAppStartParam");

    const userToken = req.cookies.get("token");

    const utm_source = req.nextUrl.searchParams.get("utm_source");

    if (tgAppStartParam) {
      const isEdit = tgAppStartParam.startsWith("edit_");
      const isGatewaySideEvent = tgAppStartParam.startsWith("gateway");

      if (isGatewaySideEvent) {
        console.log("redirecting to gateway");
        return NextResponse.redirect(new URL(`/gateway/`, req.nextUrl.origin));
      }

      if (isEdit) {
        const eventId = tgAppStartParam.replace("edit_", "");
        console.log("redirecting to edit event", eventId);
        return NextResponse.redirect(new URL(`/events/${eventId}/edit`, req.nextUrl.origin));
      }
      const isMysteryUtm = tgAppStartParam.length >= 8 && tgAppStartParam.length <= 12;
      if (isMysteryUtm) {
        console.log("redirecting to mystery " + tgAppStartParam);
        const mysteryUUID = "43d33878-a1ba-4209-9169-4845066004c6";
        const url = new URL(`/ptma/event/${mysteryUUID}`, req.nextUrl.origin);
        url.searchParams.set("not_authenticated", userToken ? "false" : "true");

        url.searchParams.set("utm_source", "telegram");
        url.searchParams.set("utm_medium", "notification");
        url.searchParams.set("utm_campaign", tgAppStartParam);

        console.log("Redirect to : ", url.href);

        return NextResponse.redirect(url);
      }

      const event = await getEventDataOnly(tgAppStartParam);
      const ptam_utm_link = utm_source ? `&utm_source=${utm_source}` : "";

      if (event?.ticketToCheckIn) {
        console.log("Redirecting to ptma", tgAppStartParam);
        const redirectUrl =
          `/ptma/event/${tgAppStartParam}?not_authenticated=${userToken ? "false" : "true"}` + ptam_utm_link;

        return NextResponse.redirect(new URL(redirectUrl, req.nextUrl.origin));
      }
      const utm_link = utm_source ? `?utm_source=${utm_source}` : "";
      return NextResponse.redirect(new URL(`/events/${tgAppStartParam}` + utm_link, req.nextUrl.origin));
    }
    console.log("no tgAppStartParam");
    // If no redirection occurs, fall through gracefully.
    return NextResponse.next();
  } catch (error) {
    console.error("Error in middleware:", error);
    return NextResponse.next();
  }
}
