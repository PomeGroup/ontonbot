import { ReactNode } from "react";
import { unstable_noStore as noStore } from "next/cache";
import Image from "next/image";
import QueryState from "@/components/blocks/QueryState";
import SectionCoverImage from "@/components/blocks/SectionCoverImage";
import PageTma from "@/components/Page";
import SeparatorTma from "@/components/Separator";

import EventAttributes from "@/components/event/EventAttributes";
import EventContent from "@/components/event/EventContent";
import EventHeader from "@/components/event/EventHeader";
import EventTmaSettings from "@/components/event/EventTmaSettings";
import WalletButton from "@/components/event/WalletButton";
import WebsiteLink from "@/components/event/WebsiteLink";
import { getEventData } from "@/services/event.services";
import { getUser } from "@/services/user.services";
import { formatDateRange, formatTimeRange } from "@/utils/date";
import { getAuthenticatedUser } from "@/utils/getAuthenticatedUser";
import { Section } from "@/components/base/section";

type EventParams = {
  params: {
    id: string;
  };
};

const Event = async ({ params }: EventParams) => {
  noStore();

  const [userId, error] = getAuthenticatedUser();
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

  const event = await getEventData(params.id);

  if (!event) {
    return (
      <QueryState
        isError
        text={`Event #${params.id} Not Found`}
      />
    );
  }

  const eventManagerRole =
    user.role === "admin" || user.user_id === event.owner;
  const date = formatDateRange(event.start_date, event.end_date);
  const time = formatTimeRange(event.start_date, event.end_date);
  const websiteLink = event?.website?.link;
  const websiteLabel = event?.website?.label;

  const attributes: [string, ReactNode][] = [];

  attributes.push(["Date", date]);
  attributes.push(["Time", time]);
  attributes.push(["Location", event.location]);
  attributes.push(["Organizer", event.organizer.first_name]);

  if (event.eventTicket) {
    attributes.push(["Ticket Price", `${event.eventTicket?.price} TON`]);
  }

  if (event?.website && websiteLabel && websiteLink) {
    attributes.push([
      "Website",
      <WebsiteLink
        key={websiteLink}
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
        <SectionCoverImage src={""} alt={""}>
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
        <EventAttributes data={attributes} />
      </Section>
      <Section
        variant={"rounded"}
        className={"py-6"}
      >
        <WalletButton />
      </Section>
      <Section
        variant={"topRounded"}
        className={"py-6"}
      >
        <EventContent content={event.description} />
      </Section>
      {/* Telegram Main Button */}
      <EventTmaSettings
        eventManagerRole={eventManagerRole}
        isSoldOut={event.isSoldOut}
        userHasTicket={!!event.userTicket}
        requiresTicketToChekin={event.ticketToCheckIn}
        orderAlreadyPlace={event.orderAlreadyPlace}
        eventId={params.id}
      />
    </PageTma>
  );
};

export default Event;
export const dynamic = "force-dynamic";
