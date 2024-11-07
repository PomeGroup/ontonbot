import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getEventDataOnly } from "./services/event.services.ssr";


export async function middleware(req: NextRequest) {
  // check for token cookie if it exists
  const tgAppStartParam = req.nextUrl.searchParams.get("tgWebAppStartParam");
  console.log("tgAppStartParam", tgAppStartParam);
  // check for token cookie if it exists
  const userToken = req.cookies.get("token");

  // if user was authenticated and the tgAppStartParam exists, redirect to the event page
  if (tgAppStartParam) {
    const isEdit = tgAppStartParam.startsWith("edit_");
    const isGatewaySideEvent = tgAppStartParam.startsWith("gateway");
    if(isGatewaySideEvent) {
      console.log("redirecting to gateway");
      return NextResponse.redirect(
        new URL(`/gateway/`, req.nextUrl.origin),
      );
    }
    if (isEdit) {
      const eventId = tgAppStartParam.replace("edit_", "");

      return NextResponse.redirect(
        new URL(`/events/${eventId}/edit`, req.nextUrl.origin),
      );
    }

    // get event data
    const event = await getEventDataOnly(tgAppStartParam);
    if (event?.ticketToCheckIn) {
      // if event.ticketToCheckIn was true
      // redirect it to the event page with ticket in ptma
      const redirectUrl = `/ptma/event/${tgAppStartParam}?not_authenticated=${userToken ? "false" : "true"}`;

      return NextResponse.redirect(new URL(redirectUrl, req.nextUrl.origin));
    }

    // if event.ticketToCheckIn was false
    // redirect it to the event page in legacy codebase
    return NextResponse.redirect(
      new URL(`/events/${tgAppStartParam}`, req.nextUrl.origin),
    );
  }
}
