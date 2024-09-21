import React, { useState, useEffect } from "react";
import { trpc } from "@/app/_trpc/client";
import EventCard from "@/app/_components/EventCard/EventCard";
import { Button } from "@/components/ui/button";
import { AlertGeneric } from "@/components/ui/alert";
import useWebApp from "@/hooks/useWebApp";

const OfflineEventPage = ({ eventId }) => {
  const [event, setEvent] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const webApp = useWebApp();

  const { data: eventData, isLoading } = trpc.events.getEvent.useQuery(
    { event_uuid: eventId, init_data: webApp?.initData || "" },
    {
      enabled: Boolean(webApp?.initData) && Boolean(eventId),
      onSuccess: (data) => {
        setEvent(data);
        localStorage.setItem(`offlineEvent_${eventId}`, JSON.stringify(data));
      },
    }
  );

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Load event from local storage if offline
    if (isOffline) {
      const storedEvent = localStorage.getItem(`offlineEvent_${eventId}`);
      if (storedEvent) {
        setEvent(JSON.parse(storedEvent));
      }
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [eventId, isOffline]);

  if (isLoading && !event) {
    return <div>Loading...</div>;
  }

  if (!event) {
    return <div>Event not found</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Offline Event View</h1>
      {isOffline && (
        <AlertGeneric
          variant="info"
          className="mb-4"
        >
          You are currently offline. Some features may be limited.
        </AlertGeneric>
      )}
      <EventCard
        event={event}
        mode="detailed"
      />
      <Button
        className="mt-4"
        onClick={() => {
          // Implement offline check-in logic here
          alert("Offline check-in not yet implemented");
        }}
      >
        Offline Check-in
      </Button>
    </div>
  );
};

export default OfflineEventPage;
