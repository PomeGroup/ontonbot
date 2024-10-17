"use client";

import { useState, useEffect, ReactNode } from "react";
import { useWithBackButton } from "@/app/_components/atoms/buttons/web-app/useWithBackButton";
import { trpc } from "@/app/_trpc/client";
import { Section } from "@/components/base/section";
import SectionCoverImage from "@/components/blocks/SectionCoverImage";
import EventAttributes from "@/components/event/EventAttributes";
import EventHeader from "@/components/event/EventHeader";
import SeparatorTma from "@/components/Separator";
import useWebApp from "@/hooks/useWebApp";
import { useParams } from "next/navigation";
import EventPageLoadingSkeleton from "../EventPageLoadingSkeleton";
import Image from "next/image";
import MainButton from "@/app/_components/atoms/buttons/web-app/MainButton";

export default function MyTicketPage() {
    useWithBackButton({});
    const params = useParams<{ UUID: string }>();
    const webApp = useWebApp();
    const [ticketData, setTicketData] = useState<any | null>(null);
    const [ticketUuid, setTicketUuid] = useState<string | null>(null);

    // State for ticket attributes (Owner and Contract Address)
    const [ticketAttributes, setTicketAttributes] = useState<[string, ReactNode][]>([]);

    const { data: event, isLoading: eventLoading, error: eventError } = trpc.events.getEvent.useQuery(
        { event_uuid: params.UUID, init_data: webApp?.initData || "" },
        { enabled: Boolean(webApp?.initData) }
    );

    const { data: user, isLoading: userLoading, error: userError } = trpc.users.getUser.useQuery(
        { init_data: webApp?.initData || "" },
        { enabled: Boolean(webApp?.initData) }
    );

    // Check if eventStartDate and eventEndDate are valid Date objects
    const eventStart = event?.start_date ? new Date(event.start_date) : null;
    const eventEnd = event?.end_date ? new Date(event.end_date) : null;
    const now = new Date();

    // Check event timing (ongoing, upcoming, past)
    const isOngoingEvent = eventStart && eventEnd ? eventStart <= now && eventEnd >= now : false;
    const isUpcomingEvent = eventStart ? eventStart > now : false;
    const isPastEvent = eventEnd ? eventEnd < now : false;

    const ticketQuery = trpc.ticket.getTicketByUuid.useQuery(
        { ticketUuid: ticketUuid ?? "" },
        {
            enabled: !!ticketUuid,
            retry: false,
        }
    );

    const eventTicketQuery = trpc.eventTicket.getEventTicketById.useQuery(
        { ticketId: ticketData?.ticket_id ?? 0 }, // Assuming ticket_id is available
        {
            enabled: !!ticketData?.ticket_id,
            retry: false,
        }
    );

    useEffect(() => {
        // Update ticket attributes
        setTicketAttributes([
            ["Owner", event?.owner ?? "Unknown"],
            ["Contract Address", event?.collection_address ?? "Not Available"]
        ]);
    }, [event]);

    // Loading and error handling
    if (eventLoading || userLoading) return <EventPageLoadingSkeleton />
    if (eventError || userError) return <div>Error loading event or user data</div>;
    if (!event || !user) return <div>Error loading event or user data</div>;

    const eventManagerRole = user.role === "admin" || user.role === "organizer" || user.user_id === event.owner;

    // Handling the state of the event based on time
    const MainButtonHandler = () => {
        if (isUpcomingEvent) {
            return <MainButton text="Event Has Not Started Yet" />
        } else if (isOngoingEvent) {
            return <MainButton text="Event Has Not Started Yet" />
        } else if (isPastEvent) {
            return <MainButton text="Event Has Ended" />
        }
    }


    return (
        <main>
            {eventManagerRole ?
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
                    {/* Display Ticket Attributes */}
                    <EventAttributes data={ticketAttributes} />
                    <MainButtonHandler />
                </Section> :
                <Section variant={"rounded"} className={"py-6"}>
                    Your not Authorize to see the ticket.
                </Section>
            }
        </main>
    );
}
