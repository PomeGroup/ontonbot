"use client";
import { unstable_noStore as noStore } from "next/cache";
import { redirect, useRouter } from "next/navigation";
import React, {useEffect, useState} from "react";
import "./page.css";
import { trpc } from "./_trpc/client";
import searchEventsInputZod from "@/zodSchema/searchEventsInputZod";
import Image from "next/image";
import EventCard from "@/app/_components/EventCard/EventCard";
import EventCardSkeleton from "@/app/_components/EventCard/EventCardSkeleton";
import EventSearchSuggestion from "@/app/_components/EventSearchSuggestion";
import { useSearchEvents } from "@/hooks/useSearchEvents";
import { FaSearch ,FaTimes} from "react-icons/fa";
export default function Home({ searchParams }: { searchParams: any }) {
    noStore();
    const router = useRouter();
    const [showSuggestions, setShowSuggestions] = useState(false);
    const { searchTerm, setSearchTerm, autoSuggestions, setAutoSuggestions, searchLoading, handleSearchChange } = useSearchEvents();    const tgWebAppStartParam = searchParams.tgWebAppStartParam;

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
            endDate:
                Math.floor(Date.now() / 1000) - (Math.floor(Date.now() / 1000) % 600),
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
    const {
        data: upcomingEvents,
        isLoading: isLoadingUpcoming,
        isError: isErrorUpcoming,
    } = trpc.events.getEventsWithFilters.useQuery(upcomingEventsParams);

    // Request for past events ordered by closest time
    const {
        data: pastEvents,
        isLoading: isLoadingPast,
        isError: isErrorPast,
    } = trpc.events.getEventsWithFilters.useQuery(pastEventsParams);

    // Request for specific slider event by UUID
    const {
        data: sliderEvent,
        isLoading: isLoadingSlider,
        isError: isErrorSlider,
    } = trpc.events.getEventsWithFilters.useQuery(sliderEventParams);



    const handleFullResultClick = () => {
        router.push(`/search?query=${searchTerm}`);
    };
    // use effect to log autoSuggestions
    useEffect(() => {
        if (autoSuggestions) {
            console.log("****//Auto suggestions:", autoSuggestions);
        }
    }, [autoSuggestions]);
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
    const handleCloseSuggestions = () => {
        setShowSuggestions(false);
    };

    const handleSearchInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        handleSearchChange(event);
        setShowSuggestions(event.target.value.length > 2);
    };
    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        handleSearchChange(event);
        if (event.target.value.length > 2) {
            setShowSuggestions(true);
        } else {
            setShowSuggestions(false);
        }
    };
    const closeSuggestions = () => {
        setShowSuggestions(false);
    };
    const handleFocus = () => {
        if (searchTerm.length > 2) {
            setShowSuggestions(true);
        }
    };
    return (
        <>
            <div className="relative">
                <input
                    type="text"
                    placeholder="Search"
                    className="w-full pl-10 pr-10 p-2 rounded-md focus:ring-0 focus:outline-none"
                    onChange={handleInputChange}
                    value={searchTerm}
                    onFocus={handleFocus}
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaSearch className="text-gray-500 w-5 h-5"/>
                </div>
                {searchTerm && (
                    <FaTimes
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-600"
                        onClick={handleCloseSuggestions}
                    />
                )}
                {showSuggestions && (
                    <EventSearchSuggestion
                        searchTerm={searchTerm}
                        onClose={closeSuggestions}
                        autoSuggestions={autoSuggestions}
                        setAutoSuggestions={setAutoSuggestions}

                    />
                )}
            </div>



            {isErrorUpcoming && <p>Error loading upcoming events</p>}
            {isErrorPast && <p>Error loading past events</p>}
            {isErrorSlider && <p>Error loading slider event</p>}
            {!(sliderEvent?.data?.length) ? (
                <p>No event found for the given UUID.</p>
            ) : (
                <EventCard event={sliderEvent?.data[0]} mode={"detailed"}/>
            )}
            <div>
                <div className="pt-2">


                <h2>Upcoming Events</h2>
                <ul>
                    {isLoadingUpcoming
                        ? [1, 2].map((index) => <EventCardSkeleton key={index}/>)
                        : upcomingEvents?.data?.map((event) => (
                            <EventCard
                                key={event.event_uuid}
                                event={event}
                            />
                        ))}
                </ul>
            </div>
            <div>
                <h2>Past Events</h2>
                <ul>
                    {isLoadingPast
                        ? [1, 2].map((index) => <EventCardSkeleton key={index}/>)
                        : pastEvents?.data?.map((event) => (
                            <EventCard
                                key={event.event_uuid}
                                event={event}
                            />
                        ))}
                </ul>
            </div>
            </div>

        </>
    );
}