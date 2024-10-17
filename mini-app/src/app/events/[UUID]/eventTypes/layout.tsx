"use client";

import QrCodeButton from "@/app/_components/atoms/buttons/QrCodeButton";
import { useWithBackButton } from "@/app/_components/atoms/buttons/web-app/useWithBackButton";
import { trpc } from "@/app/_trpc/client";
import { Card, CardContent } from "@/components/base/card";
import { Section } from "@/components/base/section";
import SectionCoverImage from "@/components/blocks/SectionCoverImage";
import EventAttributes from "@/components/event/EventAttributes";
import EventContent from "@/components/event/EventContent";
import EventHeader from "@/components/event/EventHeader";
import EventMainButton from "@/components/event/EventTmaSettings";
import PageTma from "@/components/Page";
import SeparatorTma from "@/components/Separator";
import useWebApp from "@/hooks/useWebApp";
import { UserType } from "@/types/user.types";
import { formatDateRange, formatTimeRange } from "@/utils/date";
import { useEventStore } from "@/zustand/store/eventStore"; // Zustand store
import { ChevronLeft } from "lucide-react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { ReactNode } from "react";
import EventPageLoadingSkeleton from "./../EventPageLoadingSkeleton";
import NewRegisterationCard from "../NewRegisterationCard";
import CancelEventCard from "../CancelEventCard";

type EventLayoutProps = {
  children: ReactNode; // This will be the specific content for each event type
};

export function SBT_Award() {
  return (
    <Card>
      <CardContent className="items-center justify-between">
        <h2 className={"type-title-3 font-bold"}>SBT Award</h2>
        <div className="flex items-center bg-secondary rounded-md p-2 gap-2">
          <Image
            src="/placeholder.svg"
            width={40}
            height={40}
            alt="SBT Award"
            className="w-10 h-10 mr-2"
          />
          <div>
            <h3 className="font-semibold">Gateway Participants 2024</h3>
            <p className="text-sm text-gray-500">
              {/* FIXME how to get this contents */}
              The Open Network Conference ho...
            </p>
          </div>
          <ChevronLeft className="h-5 w-5 transform rotate-180" />
        </div>
      </CardContent>
    </Card>
  );
}

const EventTypesLayout = ({ children }: EventLayoutProps) => {
  useWithBackButton({});
  const params = useParams<{ UUID: string }>();
  const webApp = useWebApp();

  const { data, isLoading: eventLoading } = trpc.events.getEvent.useQuery(
    { event_uuid: params.UUID, init_data: webApp?.initData || "" },
    { enabled: Boolean(webApp?.initData) }
  );
  const event = data;

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

  const eventManagerRole =
    user.role === "admin" || user.user_id === event.owner;

  // Initialize attributes array and ensure it starts with valid data
  const attributes: [string, ReactNode][] = [];

  const isInPersonEvent = event.participationType === "in_person";
  const isFree = !event.ticketToCheckIn;

  const start_date =
    event.start_date && event.end_date
      ? formatDateRange(event.start_date, event.end_date)
      : "Date not available";

  const time =
    event.start_date && event.end_date
      ? formatTimeRange(event.start_date, event.end_date)
      : "Time not available";

  attributes.push(["Date", start_date], ["Time", time]);

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

  return (
    <PageTma variant={"withSections"}>
      <Section
        variant={"bottomRounded"}
        className={"pb-2"}
      >
        <SectionCoverImage src={""} alt={""}>
          <Image
            priority width={352} height={352} src={event.image_url ?? ""} alt={`event-${params.UUID}`}
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
      {/* <Section variant={"rounded"} className={"py-6"}>
        <WalletButton />
      </Section> */}

      {/* Conditional QR Code or SBT Award */}
      {eventManagerRole ? (
        <>
          <Section variant={"rounded"} className={"py-6"}>
            {/* Show QR code for organizers */}
            <QrCodeButton
              event_uuid={event.event_uuid}
              url={`/events/${event.event_uuid}`}
            />
          </Section>
          <Section variant={"rounded"} className={"py-6"}>
            <NewRegisterationCard />
          </Section>
          <Section variant={"rounded"} className={"py-6"}>
            <CancelEventCard />
          </Section>
        </>
      ) : (
        <Section
          variant={"rounded"}
          className={"py-6"}
        >
          {/* Show SBT Award for regular users */}
          <SBT_Award />
        </Section>
      )}

      <Section
        variant={"topRounded"}
        className={"py-6"}
      >
        <EventContent content={event.description ?? ""} />
      </Section>

      {children}

      {/* Event Manager Settings */}
      <EventMainButton
        eventManagerRole={eventManagerRole}
        isSoldOut={Boolean(event.isSoldOut)}
        userHasTicket={Boolean(event.userTicket)}
        orderAlreadyPlace={Boolean(event.userOrder)}
        eventId={params.UUID}
        isFreeEvent={isFree}
        userRole={user.role as UserType["userRole"]}
        isInPersonEvent={isInPersonEvent}
        eventPrice={event?.eventTicket?.price ? +event.eventTicket.price : 0}
        eventStartDate={event?.start_date ? new Date(event.start_date) : null} // Pass Date object directly
        eventEndDate={event?.end_date ? new Date(event.end_date) : null} // Pass Date object directly
      />
    </PageTma>
  );
};

export default EventTypesLayout;
