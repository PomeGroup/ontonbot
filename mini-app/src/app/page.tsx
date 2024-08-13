"use client";
import { unstable_noStore as noStore } from "next/cache";
import React, { useEffect, useState } from "react";
import "./page.css";
import { trpc } from "./_trpc/client";
import searchEventsInputZod from "@/zodSchema/searchEventsInputZod";
import EventCard from "@/app/_components/EventCard/EventCard";
import EventCardSkeleton from "@/app/_components/EventCard/EventCardSkeleton";
import SearchBar from "@/app/_components/SearchBar";
import useWebApp from "@/hooks/useWebApp";
import useAuth from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Home({ searchParams }: { searchParams: any }) {
    noStore();
    const { authorized, isLoading } = useAuth();
    const webApp = useWebApp();
    console.log("asdasdasdasd", webApp?.initDataUnsafe);
    const UserId = webApp?.initDataUnsafe?.user?.id;

    const [isMyEventsTabActive, setIsMyEventsTabActive] = useState(false);

    const tgWebAppStartParam = searchParams.tgWebAppStartParam;
    const upcomingEventsParams = searchEventsInputZod.parse({
        limit: 2,
        offset: 0,
        filter: {
            participationType: ["online", "in_person"],
            startDate: Math.floor(Date.now() / 1000) - (Math.floor(Date.now() / 1000) % 600),
        },
        sortBy: "time",
    });

    const pastEventsParams = searchEventsInputZod.parse({
        limit: 2,
        offset: 0,
        filter: {
            participationType: ["online", "in_person"],
            endDate: Math.floor(Date.now() / 1000) - (Math.floor(Date.now() / 1000) % 600),
        },
        sortBy: "start_date_desc",
    });

    const sliderEventParams = searchEventsInputZod.parse({
        limit: 1,
        filter: {
            event_uuids: ["6636297e-7b58-4d80-aa3e-c877688ebae9"],
        },
    });

    const organizerEventsParams = searchEventsInputZod.parse({
        limit: 50,
        offset: 0,
        filter: {
            organizer_user_id: UserId,
        },
        sortBy: "start_date_asc",
    });

    const {
        data: upcomingEvents,
        isLoading: isLoadingUpcoming,
        isError: isErrorUpcoming,
    } = trpc.events.getEventsWithFilters.useQuery(upcomingEventsParams);

    const {
        data: pastEvents,
        isLoading: isLoadingPast,
        isError: isErrorPast,
    } = trpc.events.getEventsWithFilters.useQuery(pastEventsParams);

    const {
        data: sliderEvent,
        isLoading: isLoadingSlider,
        isError: isErrorSlider,
    } = trpc.events.getEventsWithFilters.useQuery(sliderEventParams);

    const {
        data: organizerEvents,
        isLoading: isLoadingOrganizer,
        isError: isErrorOrganizer,
        refetch: refetchOrganizerEvents,
    } = trpc.events.getEventsWithFilters.useQuery(organizerEventsParams, {
        enabled: false, // Disable automatic fetching
    });

    useEffect(() => {
        if (upcomingEvents) {
            console.log("Upcoming events:", upcomingEvents);
        }
    }, [upcomingEvents]);

    useEffect(() => {
        if (pastEvents) {
            console.log("Past events:", pastEvents);
        }
    }, [pastEvents]);

    useEffect(() => {
        if (sliderEvent) {
            console.log("Slider event:", sliderEvent);
        }
    }, [sliderEvent]);

    useEffect(() => {
        if (isMyEventsTabActive) {
            refetchOrganizerEvents(); // Fetch organizer events when tab is activated
        }
    }, [isMyEventsTabActive, refetchOrganizerEvents]);

    return (
        <>
            <SearchBar />

            <div className="pt-2">
                {sliderEvent?.data?.length && (
                    <>
                        {isLoadingSlider ? (
                            <EventCardSkeleton mode={"detailed"} />
                        ) : (
                            <EventCard event={sliderEvent?.data[0]} mode={"detailed"} />
                        )}
                    </>
                )}
            </div>

            <Tabs
                defaultValue="all-events"
                className="pt-2"
                onValueChange={(value) => setIsMyEventsTabActive(value === "my-events")}
            >
                <TabsList className="flex bg-gray-600 h-33 rounded-lg p-1">
                    <TabsTrigger value="all-events" className="flex-1 p-2 rounded-lg text-center font-medium text-white focus:outline-none focus:ring-0 ring-offset-0 transition ease-in-out duration-150">
                        All events
                    </TabsTrigger>
                    <TabsTrigger value="my-events" className="flex-1 p-2 rounded-lg text-center font-medium text-white focus:outline-none focus:ring-0 ring-offset-0 transition ease-in-out duration-150">
                        My events
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="all-events">
                    <div className="pt-2 flex justify-between items-center">
                        <h2>Upcoming Events</h2>
                        <a href="/search?tab=upcoming" className="text-zinc-300 hover:underline">See All</a>
                    </div>
                    <ul>
                        {isLoadingUpcoming
                            ? [1, 2].map((index) => <EventCardSkeleton key={index} />)
                            : upcomingEvents?.data?.map((event) => (
                                <EventCard key={event.event_uuid} event={event} />
                            ))}
                    </ul>
                    <div className="pt-2 flex justify-between items-center">
                        <h2>Past Events</h2>
                        <a href="/search?tab=past" className="text-blue-500 hover:underline">See All</a>
                    </div>
                    <ul>
                        {isLoadingPast
                            ? [1, 2].map((index) => <EventCardSkeleton key={index} />)
                            : pastEvents?.data?.map((event) => (
                                <EventCard key={event.event_uuid} event={event} />
                            ))}
                    </ul>
                </TabsContent>

                <TabsContent value="my-events">
                    <div className="pt-2">
                        <h2>Your Events as Organizer</h2>
                        <ul>
                            {isLoadingOrganizer
                                ? [1, 2].map((index) => <EventCardSkeleton key={index} />)
                                : organizerEvents?.data?.map((event) => (
                                    <EventCard key={event.event_uuid} event={event} />
                                ))}
                        </ul>
                    </div>
                </TabsContent>
            </Tabs>
        </>
    );
}
