import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getEventDataOnly } from "./services/event.services.ssr";


export async function middleware(req: NextRequest) {
  try {
    const tgAppStartParam = req.nextUrl.searchParams.get("tgWebAppStartParam");
    console.log("tgAppStartParam", tgAppStartParam);
    console.log("req.nextUrl.origin", req.nextUrl.origin);

    const userToken = req.cookies.get("token");

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

      const event = await getEventDataOnly(tgAppStartParam);
      console.log("event", event);
      if (event?.ticketToCheckIn) {
        console.log("redirecting to checkin" , tgAppStartParam);
        const redirectUrl = `/ptma/event/${tgAppStartParam}?not_authenticated=${userToken ? "false" : "true"}`;

        return NextResponse.redirect(new URL(redirectUrl, req.nextUrl.origin));
      }

      return NextResponse.redirect(new URL(`/events/${tgAppStartParam}`, req.nextUrl.origin));
    }
    console.log("no tgAppStartParam");
    // If no redirection occurs, fall through gracefully.
    return NextResponse.next();
  } catch (error) {
    console.error("Error in middleware:", error);
    return NextResponse.next();
  }
}
