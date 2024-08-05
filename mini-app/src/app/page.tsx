"use client";
import {unstable_noStore as noStore} from "next/cache";
import {redirect} from "next/navigation";
import { useEffect } from "react";
import "./page.css";
import { trpc } from "./_trpc/client";
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


    const { data: events, isLoading, isError } = trpc.events.getEventsWithFilters.useQuery({
        limit: 10,
        offset: 0,
        filter: {
            eventTypes: ["online", "in_person"],
        },
        sortBy: "time",
    });

    useEffect(() => {
        if (events) {
            console.log("Upcoming events:", events);
        }
    }, [events]);

    console.log("*******tgWebAppStartParam", tgWebAppStartParam);

    return(
    <>


    </>);
}
