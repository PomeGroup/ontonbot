"use client";
import React, { useEffect } from "react";
import { useSearchParams } from "next/navigation"; // Import useSearchParams
import { trpc } from "@/app/_trpc/client";
import searchEventsInputZod from "@/zodSchema/searchEventsInputZod";
import EventCard from "@/app/_components/EventCard/EventCard";
import EventCardSkeleton from "@/app/_components/EventCard/EventCardSkeleton";
import SearchBar from "@/app/_components/SearchBar";


const Search: React.FC = () => {
    const searchParams = useSearchParams(); // Use useSearchParams instead of useRouter
    const searchTerm = searchParams.get('query'); // Get the 'query' parameter
    console.log("searchTermsearchTermsearchTermsearchTerm", searchTerm);
    const searchParamsParsed = searchEventsInputZod.parse({
        limit: 100, // Adjust this value as needed
        offset: 0,
        search: searchTerm || "", // Ensure a string is always passed
    });

    const {
        data: searchResults,
        isLoading: isLoadingSearchResults,
        isError: isErrorSearchResults,
        refetch,
    } = trpc.events.getEventsWithFilters.useQuery(searchParamsParsed, {
        enabled: !!searchTerm,
    });

    useEffect(() => {
        if (searchTerm) {
            refetch();
        }
    }, [searchTerm, refetch]);

    return (
        <div className="container mx-auto p-4">
            <SearchBar includeQueryParam={true} />

            <div className="pt-4">
                <h2 className="text-2xl font-semibold">Search Results for "{searchTerm}"</h2>
                <div className="pt-2">
                    {isLoadingSearchResults ? (
                        Array.from({ length: 10 }).map((_, index) => (
                            <EventCardSkeleton key={index} mode="small" />
                        ))
                    ) : searchResults?.data?.length && searchResults?.data?.length > 0 ? (
                        searchResults.data.map((event) => (
                            <EventCard key={event.event_uuid} event={event} />
                        ))
                    ) : (
                        <div className="text-gray-500">No results found for "{searchTerm}".</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Search;
