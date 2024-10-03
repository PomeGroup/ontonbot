"use client";

import { trpc } from "@/app/_trpc/client";
import useWebApp from "@/hooks/useWebApp";
import { useEventStore } from "@/zustand/store/eventStore";
import { useParams } from "next/navigation";
import { useEffect, ReactNode } from "react";
import EventPageLoadingSkeleton from "../../EventPageLoadingSkeleton";
import EventTypesLayout from "../layout";


const FreeOnlineEventPage = () => {
  const params = useParams<{ UUID: string }>();
  const webApp = useWebApp();
  const setEventAttributes = useEventStore((state) => state.setAttributes); // Access Zustand store action

  const { data: event, isLoading: eventLoading } = trpc.events.getEvent.useQuery(
    { event_uuid: params.UUID, init_data: webApp?.initData || "" },
    { enabled: Boolean(webApp?.initData) }
  );

  useEffect(() => {
    if (event) {
      const additionalAttributes: [string, ReactNode][] = [
        ["Event Type", "Free Online"],
        ["Location", event?.location ?? "Location not provided"]
      ];
      setEventAttributes(additionalAttributes); // Update Zustand store with new attributes
    }
  }, [event, setEventAttributes]);

  // Handle loading state
  if (eventLoading) {
    return <EventPageLoadingSkeleton />; // Display loading skeleton while data is being fetched
  }

  // Handle error or missing event data
  if (!event) {
    return <div>Error loading event details.</div>; // Simple error handling
  }

  return (
    <EventTypesLayout>
      <p>This is a free online event. You can join using the Zoom link provided after registration.</p>
    </EventTypesLayout>
  );
};

export default FreeOnlineEventPage;

export const dynamic = "force-dynamic";
