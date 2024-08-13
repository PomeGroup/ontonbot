"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { trpc } from "@/app/_trpc/client";
import searchEventsInputZod from "@/zodSchema/searchEventsInputZod";
import EventCard from "@/app/_components/EventCard/EventCard";
import EventCardSkeleton from "@/app/_components/EventCard/EventCardSkeleton";
import SearchBar from "@/app/_components/SearchBar";


const LIMIT = 20;

const Search: React.FC = () => {
    const searchParams = useSearchParams();

    const searchTerm = searchParams.get('query') || "";
    const participationType = searchParams.get('participationType')?.split(",") || ["online", "in_person"];
    const sortBy = searchParams.get('sortBy') || "default";

    const [results, setResults] = useState<any[]>([]);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [initialFetchDone, setInitialFetchDone] = useState(false);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const lastElementRef = useRef<HTMLDivElement | null>(null);

    const searchParamsParsed = searchEventsInputZod.parse({
        limit: LIMIT,
        offset: offset,
        search: searchTerm || undefined,
        filter: {
            participationType: participationType,
        },
        sortBy: sortBy,
    });

    const {
        data: searchResults,
        isLoading: isLoadingSearchResults,
        isFetching: isFetchingSearchResults,
        refetch,
    } = trpc.events.getEventsWithFilters.useQuery(searchParamsParsed, {
        enabled: initialFetchDone,
        keepPreviousData: true,
        onSuccess: (data) => {
            setResults((prev) => (offset === 0 ? data?.data || [] : [...prev, ...data.data || []]));
            setHasMore(data?.data?.length === LIMIT);
        },
    });

    const loadMoreResults = useCallback(() => {
        if (hasMore && !isFetchingSearchResults) {
            setOffset((prevOffset) => prevOffset + LIMIT);
        }
    }, [hasMore, isFetchingSearchResults]);

    useEffect(() => {
        if (observerRef.current) observerRef.current.disconnect();

        observerRef.current = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                loadMoreResults();
            }
        });

        if (lastElementRef.current) {
            observerRef.current.observe(lastElementRef.current);
        }

        return () => {
            if (observerRef.current) observerRef.current.disconnect();
        };
    }, [lastElementRef.current, loadMoreResults]);

    useEffect(() => {
        if (!initialFetchDone) {
            refetch();
            setInitialFetchDone(true);
        } else {
            setOffset(0); // Reset the offset on search/filter change

        }
    }, [searchTerm, participationType, sortBy, refetch]);

    useEffect(() => {
        if (offset > 0) {
            refetch();
        }
    }, [offset, refetch]);

    return (
        <div className="container mx-auto p-4">

            <SearchBar includeQueryParam={true} />

            <div className="pt-4">
                <h5 className="text-2xl font-semibold">
                    Search Results for: <br />"{searchTerm || 'All Events'}"
                </h5>
                <div className="pt-2">
                    {isLoadingSearchResults && results.length === 0 ? (
                        <div className="flex flex-col gap-2">
                            {Array.from({ length: 10 }).map((_, index) => (
                                <EventCardSkeleton key={index} mode="small" />
                            ))}
                        </div>
                    ) : (
                        <>
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
                            ) : (
                                <div className="text-gray-500">No results found.</div>
                            )}
                        </>
                    )}
                </div>
                {isFetchingSearchResults && hasMore && (
                    <div className="text-center py-4 pb-5">
                        <div className="loader">Loading more results...</div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Search;
