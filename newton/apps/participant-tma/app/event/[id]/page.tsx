import { ReactNode } from "react";
import { unstable_noStore as noStore } from "next/cache";
import Image from "next/image";
import { Section } from "@ui/base/section";
import QueryState from "@ui/components/blocks/QueryState";
import SectionCoverImage from "@ui/components/blocks/SectionCoverImage";
import PageTma from "@ui/components/Page";
import SeparatorTma from "@ui/components/Separator";

import EventAttributes from "~/components/event/EventAttributes";
import EventContent from "~/components/event/EventContent";
import EventHeader from "~/components/event/EventHeader";
import EventTmaSettings from "~/components/event/EventTmaSettings";
import GatewayAgenda from "~/components/event/GatewayAgenda";
import ManageEventButton from "~/components/event/ManageEventButton";
import WalletButton from "~/components/event/WalletButton";
import WebsiteLink from "~/components/event/WebsiteLink";
import { getEventDataOnly } from "~/services/event.services.ssr";
import { getUser } from "~/services/user.services";
import { getAuthenticatedUser } from "~/utils/getAuthenticatedUser";
import AddToCalendar from "~/components/event/AddToCalendar";

type EventParams = {
  params: {
    id: string;
  };
  searchParams: { [key: string]: string | undefined };
};

const Event = async ({ params, searchParams }: EventParams) => {
  noStore();
  const [userId, error] = getAuthenticatedUser();

  const page_utm = searchParams.utm_campaign || null;

  if (error) {
    return (
      <QueryState
        isError
        text={`Authentication failed`}
        description={JSON.stringify(await error.json())}
      />
    );
  }

  const user = await getUser(userId);
  if (!user) {
    return (
      <QueryState
        isError
        text={`User #${userId} Not Found`}
      />
    );
  }

  const event = await getEventDataOnly(params.id);
  if (!event) {
    return (
      <QueryState
        isError
        text={`Event #${params.id} Not Found`}
      />
    );
  }

  if (page_utm) {
    console.log("ptma_event_page_utm", `utm_campaign=${page_utm} , user_id=${userId}`);
  }

  const eventManagerRole =
    (user?.role && user?.role === "admin") || (user?.user_id && event?.owner && user.user_id === event.owner);
  const websiteLink = event?.website?.link;
  const websiteLabel = event?.website?.label;

  const attributes: [string, ReactNode][] = [];

  attributes.push(["Location", event.location]);
  attributes.push(["Organizer", event.organizer?.first_name]);

  if (event.eventTicket) {
    attributes.push(["Ticket Price", `${event.eventTicket?.price} ${event.eventTicket.payment_type}`]);
  }

  if (event?.website && websiteLabel && websiteLink) {
    attributes.push([
      "Website",
      <WebsiteLink
        label={websiteLabel}
        link={websiteLink}
      />,
    ]);
  }

  return (
    <PageTma variant={"withSections"}>
      <Section
        variant={"bottomRounded"}
        className={"pb-2"}
      >
        <SectionCoverImage>
          <Image
            priority
            width={352}
            height={352}
            src={event.image_url}
            alt={`event-${params.id}`}
            className="border-wallet-separator-color w-full rounded-lg border-[0.33px] object-contain"
          />
        </SectionCoverImage>
        <EventHeader
          event_uuid={event.event_uuid}
          title={event.title}
          description={event.subtitle}
        />
        <SeparatorTma />
        <EventAttributes
          event={{
            end_date: event.end_date,
            start_date: event.start_date,
          }}
          data={attributes}
        />
      </Section>
      <Section
        variant={"rounded"}
        className={"py-6 space-y-2"}
      >
        {eventManagerRole && <ManageEventButton />}
        <AddToCalendar
          description={event.subtitle}
          title={event.title}
          startDate={Number(event.start_date) * 1000}
          endDate={Number(event.end_date) * 1000}
        />
      </Section>
      <Section
        variant={"rounded"}
        className={"py-6"}
      >
        <WalletButton />
      </Section>
      {/* Just Agenda Section Only For gateway event */}
      {event?.event_uuid === "6acf01ed-3122-498a-a937-329766b459aa" && (
        <Section
          variant={"rounded"}
          className={"py-6"}
        >
          <GatewayAgenda />
        </Section>
      )}
      {/* Agenda Section END */}
      <Section
        variant={"topRounded"}
        className={"py-6"}
      >
        <EventContent content={event.description} />
      </Section>
      {/* Telegram Main Button */}
      <EventTmaSettings
        requiresTicketToChekin={event.ticketToCheckIn}
        eventId={params.id}
        utm={page_utm}
      />
    </PageTma>
  );
};

export default Event;
export const dynamic = "force-dynamic";
