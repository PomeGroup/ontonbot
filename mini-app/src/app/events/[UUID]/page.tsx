"use client";

import { lazy, LazyExoticComponent, Suspense } from "react";
import useWebApp from "@/hooks/useWebApp";
import { trpc } from "@/app/_trpc/client";
import EventPageLoadingSkeleton from "./EventPageLoadingSkeleton";

// Lazy import event type pages from their respective folders
const PaidInPersonEvent = lazy(
  () => import("./eventTypes/paid-in-person-event/page")
);
const FreeOnlineEvent = lazy(
  () => import("./eventTypes/free-online-event/page")
);
const FreeInPersonEvent = lazy(
  () => import("./eventTypes/free-in-person-event/page")
);
const PaidOnlineEvent = lazy(
  () => import("./eventTypes/paid-online-event/page")
);

type EventParams = { params: { UUID: string } };

// Common type for all event components
interface EventProps {
  UUID: string;
  eventType: string;
  location?: string;
  platform?: string;
  ticketPrice?: number;
}

const EventPage = ({ params }: EventParams) => {
  const webApp = useWebApp();

  const eventData = trpc.events.getEvent.useQuery(
    { event_uuid: params.UUID, init_data: webApp?.initData || "" },
    {
      queryKey: ["events.getEvent", { event_uuid: params.UUID, init_data: webApp?.initData || "" }],
      enabled: Boolean(webApp?.initData),
    }
  );

  const event = eventData.data;
  if (!event) return <EventPageLoadingSkeleton />; // Handle loading state

  // Constants to simplify the logic
  const isInPersonEvent = event.participationType === "in_person";
  const isOnlineEvent = event.participationType === "online";
  const isFree = !event.ticketToCheckIn;

  // Determine which event page to render based on event type
  let EventComponent: LazyExoticComponent<() => JSX.Element> | undefined;

  if (!isFree && isInPersonEvent) {
    EventComponent = PaidInPersonEvent;
  } else if (isFree && isOnlineEvent) {
    EventComponent = FreeOnlineEvent;
  } else if (isFree && isInPersonEvent) {
    EventComponent = FreeInPersonEvent;
  } else if (!isFree && isOnlineEvent) {
    EventComponent = PaidOnlineEvent;
  }

  // Render the determined event component
  return (
    <Suspense fallback={<EventPageLoadingSkeleton />}>
      {EventComponent ? (
        <EventComponent/>
      ) : (
        <div>No event component available</div> // Handle the case where no component matches
      )}
    </Suspense>
  );
};

export default EventPage;
export const dynamic = "force-dynamic";
