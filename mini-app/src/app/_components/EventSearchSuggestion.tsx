import EventCard from "@/app/_components/EventCard/EventCard";
import { trpc } from "@/app/_trpc/client";
import searchEventsInputZod from "@/zodSchema/searchEventsInputZod";
import { debounce } from "lodash";
import React, { useCallback, useEffect, useState } from "react";

interface EventSearchSuggestionProps {
  searchTerm: string;
}

const EventSearchSuggestion: React.FC<EventSearchSuggestionProps> = ({
  searchTerm,
}) => {
  const [autoSuggestions, setAutoSuggestions] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const { data: searchResults, refetch } =
    trpc.events.getEventsWithFilters.useQuery(
      searchEventsInputZod.parse({
        limit: 5,
        offset: 0,
        search: searchTerm,
      }),
      {
        enabled: false,
        onSuccess: (data) => {
          setAutoSuggestions(data || []);
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
      refetch({
        queryKey: searchEventsInputZod.parse({
          limit: 5,
          offset: 0,
          search: value,
        }),
      });
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
    if (searchResults) {
      setAutoSuggestions(searchResults.data || []);
      console.log("Search results:", searchResults);
    }
  }, [searchResults]);

  return (
    <div className="absolute top-12 w-full bg-white border rounded-md shadow-lg bg-[rgba(51,51,51,0.95)]  z-10">
      {searchLoading ? (
        <div className="p-2">Loading...</div>
      ) : autoSuggestions?.length > 0 ? (
        autoSuggestions.map((event) => (
          <EventCard
            key={event.event_uuid}
            event={event}
          />
        ))
      ) : (
        <div className="p-2">No results found</div>
      )}
      <div className="p-2">
        <button className="w-full text-blue-500">Full Result</button>
      </div>
    </div>
  );
};

export default EventSearchSuggestion;
