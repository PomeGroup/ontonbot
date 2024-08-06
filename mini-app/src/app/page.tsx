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
        limit: 2,
        offset: 0,
        filter: {
            eventTypes: ["online", "in_person"],
        },
        sortBy: "time",
    });

    const pastEventsParams = searchEventsInputZod.parse({
        limit: 2,
        offset: 0,
        filter: {
            eventTypes: ["online", "in_person"],
            endDate: Math.floor(Date.now() / 1000) - (Math.floor(Date.now() / 1000)% 600),
        },
        sortBy: "start_date_desc",
    });
    const sliderEventParams = searchEventsInputZod.parse({
        limit: 1,
        filter: {
            event_uuids: ["6636297e-7b58-4d80-aa3e-c877688ebae9"],
        },

    });

    // Request for upcoming events ordered by closest time
    const { data: upcomingEvents, isLoading: isLoadingUpcoming, isError: isErrorUpcoming } = trpc.events.getEventsWithFilters.useQuery(upcomingEventsParams);

    // Request for past events ordered by closest time
    const { data: pastEvents, isLoading: isLoadingPast, isError: isErrorPast } = trpc.events.getEventsWithFilters.useQuery(pastEventsParams);

    // Request for specific slider event by UUID
    const { data: sliderEvent, isLoading: isLoadingSlider, isError: isErrorSlider } = trpc.events.getEventsWithFilters.useQuery(sliderEventParams);


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
            {isLoadingUpcoming && <p>Loading upcoming events...</p>}
            {isLoadingPast && <p>Loading past events...</p>}
            {isLoadingSlider && <p>Loading slider event...</p>}

            {isErrorUpcoming && <p>Error loading upcoming events</p>}
            {isErrorPast && <p>Error loading past events</p>}
            {isErrorSlider && <p>Error loading slider event</p>}

            <div>
                <h2>Upcoming Events</h2>
                <ul>
                    {upcomingEvents?.data?.map(event => (
                        <li key={event.event_uuid}>{event.title}</li>
                    ))}
                </ul>
            </div>

            <div>
                <h2>Past Events</h2>
                <ul>
                    {pastEvents?.data?.map(event => (
                        <li key={event.event_uuid}>{event.title}</li>
                    ))}
                </ul>
            </div>

            <div>
                <h2>Slider Event</h2>
                {sliderEvent && <div>{sliderEvent?.data[0]?.title}</div>}
            </div>
        </>
    );
}
