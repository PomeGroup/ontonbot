import React, { useCallback, useEffect, useState, useRef } from "react";
import EventCard from "@/app/_components/EventCard/EventCard";
import { trpc } from "@/app/_trpc/client";
import searchEventsInputZod from "@/zodSchema/searchEventsInputZod";
import { debounce } from "lodash";
import { FaTimes } from "react-icons/fa";
import EventCardSkeleton from "@/app/_components/EventCard/EventCardSkeleton";

interface EventSearchSuggestionProps {
    searchTerm: string;
    onClose: () => void;
    autoSuggestions: any[];
    setAutoSuggestions: (value: any[]) => void;
}

const EventSearchSuggestion: React.FC<EventSearchSuggestionProps> = ({
                                                                         searchTerm,
                                                                         onClose,
                                                                         autoSuggestions,
                                                                         setAutoSuggestions
                                                                     }) => {
    // const [autoSuggestions, setAutoSuggestions] = useState<any[]>([]);
        const [searchLoading, setSearchLoading] = useState(false);
    const suggestionBoxRef = useRef<HTMLDivElement>(null);

    const { data: searchResults, refetch } = trpc.events.getEventsWithFilters.useQuery(
        searchEventsInputZod.parse({
            limit: 5,
            offset: 0,
            search: searchTerm,
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
            refetch().then(r => console.log(r));
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

    // Close suggestion box when clicking outside of it
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
    useEffect(() => {
        if (autoSuggestions) {
            console.log("****---------------//Auto suggestions:", autoSuggestions);
        }
    }, [autoSuggestions]);
    return (
        <div
            ref={suggestionBoxRef}
            className="absolute top-9 pt-1 w-full border-0 rounded-b-md  shadow-lg bg-[rgba(51,51,51,0.98)] z-10"
        >
            {/*<div className="flex justify-between p-2 border-b border-gray-700">*/}
            {/*    <span>Suggestions</span>*/}
            {/*    <button onClick={onClose} className="text-gray-400">*/}
            {/*        <FaTimes />*/}
            {/*    </button>*/}
            {/*</div>*/}
            {searchLoading   ? (
                <div className="p-2">
                    {Array.from({length: 2}).map((_, index) => (
                        <EventCardSkeleton key={index} mode="small"/>
                    ))}
                </div>
            ) : autoSuggestions?.length > 0 ? (
                <>
                    {autoSuggestions.map((event) => (
                        <EventCard key={event.event_uuid} event={event} mode="small"/>
                    ))}
                    <div className="p-2">
                        <button className="w-full text-blue-500">All Results</button>
                    </div>
                </>
            ) : (
                <div className="p-2">No results found</div>
            )}
        </div>
    );
};

export default EventSearchSuggestion;
