"use client";

import { useEffect } from "react";
import useWebApp from "@/hooks/useWebApp";
import { useEventStore } from "@/zustand/store/eventStore";
import { trpc } from "@/app/_trpc/client";
import { useParams } from "next/navigation";
import EventPageLoadingSkeleton from "../../EventPageLoadingSkeleton"; // Import the loading skeleton

const FreeInPersonEventPage = () => {
  const params = useParams<{ UUID: string; }>()
  const webApp = useWebApp();
  const setEventAttributes = useEventStore((state) => state.setAttributes); // Access the Zustand action
  const { data: event, isLoading: eventLoading } = trpc.events.getEvent.useQuery(
    { event_uuid: params.UUID, init_data: webApp?.initData || "" },
    { enabled: Boolean(webApp?.initData) }
  );

  useEffect(() => {
    setEventAttributes([
      ["Event Type", "Free In-Person"],
      ["Location", event?.location ?? "Location not provided"]
    ]);
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
    <div>
      <p>This is a free event that will take place in person. Everyone is welcome!</p>
    </div>
  );
};

export default FreeInPersonEventPage;
export const dynamic = "force-dynamic";
