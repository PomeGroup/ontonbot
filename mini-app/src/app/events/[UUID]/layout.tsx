"use client";

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
import { formatDateRange, formatTimeRange } from "@/utils/date";
import { Section } from "@/components/base/section";
import useWebApp from "@/hooks/useWebApp";
import { trpc } from "@/app/_trpc/client";
import { useEventStore } from "@/zustand/store/eventStore"; // Zustand store
import { useParams } from "next/navigation";
import EventPageLoadingSkeleton from "./EventPageLoadingSkeleton";
import { useWithBackButton } from "@/app/_components/atoms/buttons/web-app/useWithBackButton";

type EventLayoutProps = {
  children: ReactNode; // This will be the specific content for each event type
};

const EventLayout = ({ children }: EventLayoutProps) => {
  useWithBackButton({})
  const params = useParams<{ UUID: string }>();
  const webApp = useWebApp();

  const { data: event, isLoading: eventLoading } = trpc.events.getEvent.useQuery(
    { event_uuid: params.UUID, init_data: webApp?.initData || "" },
    { enabled: Boolean(webApp?.initData) }
  );

  const { data: user, isLoading: userLoading } = trpc.users.getUser.useQuery(
    { init_data: webApp?.initData || "" },
    { enabled: Boolean(webApp?.initData) }
  );

  const { attributes: childAttributes } = useEventStore(); // Pull attributes from the Zustand store

  // Loading state handling
  if (eventLoading || userLoading) {
    return <EventPageLoadingSkeleton />;
  }

  if (!event || !user) {
    return <div>Error loading event or user data</div>;
  }

  const eventManagerRole = user.role === "admin" || user.user_id === event.owner;
  const date = formatDateRange(event.start_date!, event.end_date!);
  const time = formatTimeRange(event.start_date!, event.end_date!);

  // Initialize attributes array and ensure it starts with valid data
  const attributes: [string, ReactNode][] = [];

  // Add event attributes dynamically
  attributes.push(
    ["Date", date],
    ["time",  time],
  );

  // Ensure childAttributes is not empty and merge it if it exists
  if (childAttributes && childAttributes.length > 0) {
    attributes.push(...childAttributes);
  }

  // Add ticket price (Free if no price)
  if (event.eventTicket && event.eventTicket.price) {
    attributes.push(["Ticket Price", `${event.eventTicket?.price} TON`]);
  } else {
    attributes.push(["Ticket Price", "Free"]);
  }

  console.log(attributes);
  

  return (
    <PageTma variant={"withSections"}>
      <Section variant={"bottomRounded"} className={"pb-2"}>
        <SectionCoverImage src={""} alt={""}>
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
      <Section variant={"rounded"} className={"py-6"}>
        <WalletButton />
      </Section>

      <Section variant={"topRounded"} className={"py-6"}>
        <EventContent content={event.description ?? ""} />
      </Section>

      {children}

      {/* Event Manager Settings */}
      <EventTmaSettings
        eventManagerRole={eventManagerRole}
        isSoldOut={!!event?.isSoldOut}
        userHasTicket={!!event?.userTicket}
        requiresTicketToCheckin={!!event?.ticketToCheckIn}
        orderAlreadyPlace={!!event?.userOrder}
        eventId={params.UUID}
      />
    </PageTma>
  );
};

export default EventLayout;