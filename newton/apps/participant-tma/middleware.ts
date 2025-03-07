import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getEventDataOnly } from "./services/event.services.ssr";

export async function middleware(req: NextRequest) {
  try {
    const tgAppStartParam = req.nextUrl.searchParams.get("tgWebAppStartParam");

    const userToken = req.cookies.get("token");
    console.log("tgAppStartParam", tgAppStartParam);
    const utm_source = req.nextUrl.searchParams.get("utm_source");

    if (tgAppStartParam) {
      const isEdit = tgAppStartParam.startsWith("edit_");
      const isAffiliate = tgAppStartParam.includes("-affiliate-");
      const isOrganizerProfile = tgAppStartParam.startsWith("channels_");


      if (isOrganizerProfile) {
        console.log("redirecting to organizer profile");
        return NextResponse.redirect(new URL(`/channels/${tgAppStartParam.replace("channels_", "")}`, req.nextUrl.origin));

      }

      if (isEdit) {
        const eventId = tgAppStartParam.replace("edit_", "");
        console.log("redirecting to edit event", eventId);
        return NextResponse.redirect(new URL(`/events/${eventId}/manage`, req.nextUrl.origin));
      }


      if (isAffiliate) {
        const splitAffiliate = tgAppStartParam.split("-affiliate-");
        const affiliateId = splitAffiliate[1] ?? "";
        console.log("redirecting to affiliate", splitAffiliate);
        const url = new URL(`/ptma/event/${splitAffiliate[0]}`, req.nextUrl.origin);
        url.searchParams.set("is_affiliate", "1");
        url.searchParams.set("affiliate_id", affiliateId);
        console.log("redirecting to affiliate", url.searchParams);

        return NextResponse.redirect(url);
      }

      const event = await getEventDataOnly(tgAppStartParam, null);
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
