// Home.tsx

"use client";
import { unstable_noStore as noStore } from "next/cache";
import React, { useEffect } from "react";
import "./page.css";
import { trpc } from "./_trpc/client";
import searchEventsInputZod from "@/zodSchema/searchEventsInputZod";
import EventCard from "@/app/_components/EventCard/EventCard";
import EventCardSkeleton from "@/app/_components/EventCard/EventCardSkeleton";
import SearchBar from "@/app/_components/SearchBar";
import useWebApp from "@/hooks/useWebApp";
import useAuth from "@/hooks/useAuth";

export default function Home({ searchParams }: { searchParams: any }) {
    noStore();
    const { authorized, isLoading } = useAuth();
    const webApp = useWebApp();
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

    return (
        <>
            <SearchBar />

            <div className="pt-2">

                {sliderEvent?.data?.length &&  (
                    <>
                        {isLoadingSlider ? (
                            <EventCardSkeleton mode={"detailed"} />
                        ) : (
                            <EventCard event={sliderEvent?.data[0]} mode={"detailed"} />
                        )}
                    </>

                )}
            </div>
            <div className="pt-2">
                <h2>Upcoming Events</h2>
                <ul>
                    {isLoadingUpcoming
                        ? [1, 2].map((index) => <EventCardSkeleton key={index} />)
                        : upcomingEvents?.data?.map((event) => (
                            <EventCard key={event.event_uuid} event={event} />
                        ))}
                </ul>
            </div>
            <div>
                <h2>Past Events</h2>
                <ul>
                    {isLoadingPast
                        ? [1, 2].map((index) => <EventCardSkeleton key={index} />)
                        : pastEvents?.data?.map((event) => (
                            <EventCard key={event.event_uuid} event={event} />
                        ))}
                </ul>
            </div>
        </>
    );
}
