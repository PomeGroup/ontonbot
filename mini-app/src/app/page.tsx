"use client";
import {unstable_noStore as noStore} from "next/cache";
import {redirect} from "next/navigation";
import { useEffect } from "react";
import "./page.css";
import { trpc } from "./_trpc/client";
import searchEventsInputZod from "@/zodSchema/searchEventsInputZod";
export default function Home({searchParams}: { searchParams: any }) {
    noStore();
    const tgWebAppStartParam = searchParams.tgWebAppStartParam;
    // if (tgWebAppStartParam !== undefined) {
    //   console.log("*******tgWebAppStartParam", tgWebAppStartParam);
    //   redirect(`/events/${tgWebAppStartParam}`);
    // }
    //
    // redirect("https://society.ton.org/activities/events");
    console.log("*******tgWebAppStartParam", tgWebAppStartParam);


    // Define the query parameters using the Zod schema
    const upcomingEventsParams = searchEventsInputZod.parse({
        limit: 30,
        offset: 0,
        filter: {
            eventTypes: ["online", "in_person"],
        },
        sortBy: "time",
    });

    const pastEventsParams = searchEventsInputZod.parse({
        limit: 30,
        offset: 0,
        filter: {
            eventTypes: ["online", "in_person"],
            endDate: Math.floor(Date.now() / 1000),
        },
        sortBy: "start_date_desc",
    });

    // Request for upcoming events ordered by closest time
    const { data: upcomingEvents, isLoading: isLoadingUpcoming, isError: isErrorUpcoming } = trpc.events.getEventsWithFilters.useQuery(upcomingEventsParams);

    // Request for past events ordered by closest time
    const { data: pastEvents, isLoading: isLoadingPast, isError: isErrorPast } = trpc.events.getEventsWithFilters.useQuery(pastEventsParams);

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

    if (isLoadingUpcoming || isLoadingPast) {
        return <div>Loading...</div>;
    }

    if (isErrorUpcoming || isErrorPast) {
        return <div>Error loading events.</div>;
    }

    return (
        <>
            <div>
                <h2>Upcoming Events</h2>
                <ul>
                    {upcomingEvents?.map(event => (
                        <li key={event.event_uuid}>{event.title}</li>
                    ))}
                </ul>
            </div>
            <div>
                <h2>Past Events</h2>
                <ul>
                    {pastEvents?.map(event => (
                        <li key={event.event_uuid}>{event.title}</li>
                    ))}
                </ul>
            </div>
        </>
    );
}
