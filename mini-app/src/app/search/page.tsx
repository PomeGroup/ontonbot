"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { trpc } from "@/app/_trpc/client";
import searchEventsInputZod from "@/zodSchema/searchEventsInputZod";
import EventCard from "@/app/_components/EventCard/EventCard";
import EventCardSkeleton from "@/app/_components/EventCard/EventCardSkeleton";
import SearchBar from "@/app/_components/SearchBar";

const LIMIT = 20; // Number of items to load per page

const Search: React.FC = () => {
    const searchParams = useSearchParams();
    const searchTerm = searchParams.get('query');
    const [results, setResults] = useState<any[]>([]);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const observerRef = useRef<IntersectionObserver | null>(null);  // Ref for the IntersectionObserver
    const lastElementRef = useRef<HTMLDivElement | null>(null);     // Ref for the last element to be observed

    const searchParamsParsed = searchEventsInputZod.parse({
        limit: LIMIT,
        offset: offset,
        search: searchTerm || "",
    });

    const {
        data: searchResults,
        isLoading: isLoadingSearchResults,
        isError: isErrorSearchResults,
        refetch,
    } = trpc.events.getEventsWithFilters.useQuery(searchParamsParsed, {
        enabled: !!searchTerm,
        keepPreviousData: true,
        onSuccess: (data) => {
            if (data?.data?.length && data.data.length < LIMIT) {
                setHasMore(false);
            }
            setResults((prev) => [...prev, ...data.data || []]);
            setIsFetchingMore(false); // Stop the loading indicator when more data is loaded
        },
    });

    const observeLastElement = useCallback(() => {
        if (isLoadingSearchResults || isFetchingMore) return;
        if (observerRef.current) observerRef.current.disconnect();  // Disconnect the old observer if it exists

        observerRef.current = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && hasMore) {
                setIsFetchingMore(true); // Start the loading indicator when fetching more data
                setOffset((prevOffset) => prevOffset + LIMIT);
            }
        });

        if (lastElementRef.current) {
            observerRef.current.observe(lastElementRef.current);  // Observe the last element if it exists
        }
    }, [isLoadingSearchResults, isFetchingMore, hasMore]);

    useEffect(() => {
        observeLastElement();  // Observe the last element when the component mounts or updates

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();  // Clean up observer on unmount
            }
        };
    }, [observeLastElement]);

    useEffect(() => {
        if (searchTerm) {
            setResults([]);
            setOffset(0);
            setHasMore(true);
            setIsFetchingMore(false);
            refetch();
        }
    }, [searchTerm, refetch]);


    return (
        <div className="container mx-auto p-4">
            <SearchBar includeQueryParam={true} />

            <div className="pt-4">
                <h5 className="text-2xl font-semibold">Search Results for: <br/>"{searchTerm}"</h5>
                <div className="pt-2">
                    {results.length > 0 ? (
                        results.map((event, index) => {
                            if (results.length === index + 1) {
                                return (
                                    <div ref={lastElementRef} key={event.event_uuid}>
                                        <EventCard event={event} />
                                    </div>
                                );
                            } else {
                                return <EventCard key={event.event_uuid} event={event} />;
                            }
                        })
                    ) : isLoadingSearchResults ? (
                        <div className="flex flex-col gap-2">
                            {Array.from({ length: 10 }).map((_, index) => (
                                <EventCardSkeleton key={index} mode="small" />
                            ))}
                        </div>
                    ) : (
                        <div className="text-gray-500">No results found for "{searchTerm}".</div>
                    )}
                </div>
                {isFetchingMore && (
                    <div className="text-center py-4 pb-5">
                        <div className="loader">Loading more results...</div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Search;
