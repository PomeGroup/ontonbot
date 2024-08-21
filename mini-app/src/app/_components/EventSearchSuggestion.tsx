import React, { useCallback, useEffect, useState, useRef } from "react";
import EventCard from "@/app/_components/EventCard/EventCard";
import { trpc } from "@/app/_trpc/client";
import searchEventsInputZod from "@/zodSchema/searchEventsInputZod";
import { debounce } from "lodash";
import { FaTimes, FaArrowAltCircleRight } from "react-icons/fa";
import EventCardSkeleton from "@/app/_components/EventCard/EventCardSkeleton";
import { useRouter } from "next/navigation";

interface EventSearchSuggestionProps {
    searchTerm: string;
    onClose: () => void;
    autoSuggestions: any[];
    setAutoSuggestions: (value: any[]) => void;
    handleFilterApply: (value: any[]) => void;
}

const EventSearchSuggestion: React.FC<EventSearchSuggestionProps> = ({
                                                                         searchTerm,
                                                                         onClose,
                                                                         autoSuggestions,
                                                                         setAutoSuggestions,
                                                                         handleFilterApply
                                                                     }) => {
    const router = useRouter();
    const [searchLoading, setSearchLoading] = useState(false);
    const suggestionBoxRef = useRef<HTMLDivElement>(null);

    const { data: searchResults, refetch } = trpc.events.getEventsWithFilters.useQuery(
        searchEventsInputZod.parse({
            limit: 3,
            offset: 0,
            search: searchTerm,
            filter: {
                startDate:
                    Math.floor(Date.now() / 1000) - (Math.floor(Date.now() / 1000) % 600),
            },
        }),
        {
            enabled: false,
            onSuccess: (data) => {
                setAutoSuggestions(data?.data || []);
                setSearchLoading(false);
            },
            onError: () => {
                setAutoSuggestions([]);
                setSearchLoading(false);
            },
        }
    );

    const debouncedFetchSearchResults = useCallback(
        debounce((value: string) => {
            setSearchLoading(true);
            refetch().then((r) => console.log(r));
        }, 300),
        [refetch]
    );

    useEffect(() => {
        if (searchTerm.length > 2) {
            debouncedFetchSearchResults(searchTerm);
        } else {
            setAutoSuggestions([]);
        }
    }, [searchTerm, debouncedFetchSearchResults]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                suggestionBoxRef.current &&
                !suggestionBoxRef.current.contains(event.target as Node)
            ) {
                onClose();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [onClose]);

    // const handleNavigate = useCallback(() => {
    //     if (router) {
    //         router.push(`/search?query=${searchTerm}`);
    //     }
    // }, [searchTerm, router]);

    return (
        <div
            ref={suggestionBoxRef}
            className="absolute pt-4  mt-1 w-full border-0 rounded-t-3xl shadow-lg bg-[rgba(51,51,51,0.98)] z-10"
        >
            {searchLoading ? (
                <div className="p-2">
                    {Array.from({ length: 1 }).map((_, index) => (
                        <EventCardSkeleton key={index} mode="small" />
                    ))}
                </div>
            ) : autoSuggestions?.length > 0 ? (
                <>
                    {autoSuggestions.map((event) => (
                        <EventCard key={event.event_uuid} event={event} mode="small" />
                    ))}
                    <button
                        className="w-full text-s text-center py-2 bg-zinc-400 text-zinc-100 h-8 flex items-center justify-center"
                        onClick={handleFilterApply as any}
                    >
                        <span>All Results</span>

                    </button>
                </>
            ) : (
               <></>
            )}
        </div>
    );
};

export default EventSearchSuggestion;
