"use client";

import { trpc } from "@/app/_trpc/client";
import useWebApp from "@/hooks/useWebApp";
import { useEventStore } from "@/zustand/store/eventStore";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import EventPageLoadingSkeleton from "../../EventPageLoadingSkeleton";

function PaidOnlineEventPage() {
    const params = useParams<{ UUID: string; }>()
    const webApp = useWebApp();
    const setEventAttributes = useEventStore((state) => state.setAttributes); // Access the Zustand action
    const { data: event, isLoading: eventLoading } = trpc.events.getEvent.useQuery(
        { event_uuid: params.UUID, init_data: webApp?.initData || "" },
        { enabled: Boolean(webApp?.initData) }
    );

    useEffect(() => {
        setEventAttributes([
            ["Event Type", "Paid Online"],
            ["Location", event?.location! ?? "Didn't provide"]
        ]);
    }, [setEventAttributes, event]);

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
            <h1>This is paid-online-event page</h1>
        </div>
    );
}

export default PaidOnlineEventPage;
export const dynamic = "force-dynamic";