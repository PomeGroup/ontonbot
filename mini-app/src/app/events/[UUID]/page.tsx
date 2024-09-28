"use client";

import useWebApp from "@/hooks/useWebApp";
import { ReactNode } from "react";
import Image from "next/image";
import SectionCoverImage from "@/components/blocks/SectionCoverImage";
import PageTma from "@/components/Page";
import SeparatorTma from "@/components/Separator";
import EventAttributes from "@/components/event/EventAttributes";
import EventContent from "@/components/event/EventContent";
import EventHeader from "@/components/event/EventHeader";
import EventTmaSettings from "@/components/event/EventTmaSettings";
import WalletButton from "@/components/event/WalletButton";
import WebsiteLink from "@/components/event/WebsiteLink";
import { formatDateRange, formatTimeRange } from "@/utils/date";
import { Section } from "@/components/base/section";
import { trpc } from "@/app/_trpc/client";
import { useWithBackButton } from "@/app/_components/atoms/buttons/web-app/useWithBackButton";

type EventParams = { params: { UUID: string } };

// Event page component (handles both free and paid events)
const EventPage = ({ params }: EventParams) => {
  useWithBackButton({ whereTo: "/" });
  const webApp = useWebApp();
  const eventData = trpc.events.getEvent.useQuery(
    {
      event_uuid: params.UUID,
      init_data: webApp?.initData || "",
    },
    {
      queryKey: [
        "events.getEvent",
        { event_uuid: params.UUID, init_data: webApp?.initData || "" },
      ],
      enabled: Boolean(webApp?.initData),
    }
  );

  const userData = trpc.users.getUser.useQuery(
    {
      init_data: webApp?.initData || "",
    },
    {
      enabled: Boolean(webApp?.initData),
    }
  );
  const user = userData.data;
  if (!user) return null; // FIMXE change it to loading
  const event = eventData.data;
  if (!event) return null; // FIMXE change it to loading

  const eventManagerRole =
    user.role === "admin" || user.user_id === event.owner;
  const date = formatDateRange(event.start_date!, event.end_date!);
  const time = formatTimeRange(event.start_date!, event.end_date!);

  const attributes: [string, ReactNode][] = [];
  attributes.push(["Date", date]);
  attributes.push(["Time", time]);
  attributes.push(["Location", event.location]);
  attributes.push(["Organizer", event?.organizer?.first_name]); //

  // Comment for paid event
  // Adding ticket price for paid events
  if (event.eventTicket) {
    attributes.push(["Ticket Price", `${event.eventTicket?.price} TON`]);
  }

  // Comment for free event
  // Handling free events (no ticket price)
  if (!event?.eventTicket!) {
    attributes.push(["Ticket Price", "Free"]);
  }

  // const websiteLink = event?.website?.link!;
  // const websiteLabel = event?.website?.label!;
  // if (event?.website && websiteLabel && websiteLink) {
  //   attributes.push([
  //     "Website",
  //     <WebsiteLink
  //       key={websiteLink}
  //       label={websiteLabel}
  //       link={websiteLink}
  //     />,
  //   ]);
  // }
  // FIXME get event image from it's state
  return (
    <PageTma variant={"withSections"}>
      <Section
        variant={"bottomRounded"}
        className={"pb-2"}
      >
        <SectionCoverImage
          src={""}
          alt={""}
        >
          <Image
            priority
            width={352}
            height={352}
            src={event.image_url ?? ""}
            alt={`event-${params.UUID}`}
            className="border-wallet-separator-color w-full rounded-lg border-[0.33px] object-contain"
          />
        </SectionCoverImage>
        <EventHeader
          event_uuid={event.event_uuid}
          title={event.title ?? ""}
          description={event.subtitle ?? ""}
        />
        <SeparatorTma />
        <EventAttributes data={attributes} />
      </Section>

      {/* Free or Paid Event Wallet Button */}
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
        <EventContent content={event.description ?? ""} />
      </Section>

      {/* Event Manager Settings */}
      <EventTmaSettings
        eventManagerRole={eventManagerRole}
        isSoldOut={!!event?.isSoldOut} // Fix by using double negation to ensure boolean type
        userHasTicket={!!event?.userTicket} // Fix by ensuring that userTicket is handled safely
        requiresTicketToCheckin={!!event?.ticketToCheckIn} // Ensure it's always a boolean
        orderAlreadyPlace={!!event?.userOrder} // Handle missing property safely
        eventId={params.UUID}
      />
    </PageTma>
  );
};

export default EventPage;
export const dynamic = "force-dynamic";
