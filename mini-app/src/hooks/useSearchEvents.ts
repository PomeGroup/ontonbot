import React, { useState, useEffect, useCallback } from "react";
import { debounce } from "lodash";
import searchEventsInputZod from "@/zodSchema/searchEventsInputZod";
import { trpc } from "@/app/_trpc/client";

export const useSearchEvents = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [autoSuggestions, setAutoSuggestions] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [filters, setFilters] = useState({ participationType: ["online", "in_person"], sortBy: "default" , society_hub_id: []});

  const { data: searchResults, refetch } = trpc.events.getEventsWithFilters.useQuery(
      searchEventsInputZod.parse({
        limit: 3,
        offset: 0,
        search: searchTerm,
        filter: {
          participationType: filters.participationType,
          ...(filters.sortBy === "default" && {
            startDate: Math.floor(Date.now() / 1000) - (Math.floor(Date.now() / 1000) % 600),
            society_hub_id: filters.society_hub_id,
          })
        },

        sortBy: filters.sortBy,
      }),
      {
        enabled: false,
        onSuccess: (data) => {
          setAutoSuggestions(data.data || []);
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
        refetch().then(r => r);
      }, 300),
      [refetch]
  );

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const searchValue = event.target.value;
    setSearchTerm(searchValue);

    if (searchValue.length > 2) {
      debouncedFetchSearchResults(searchValue);
    } else {
      setAutoSuggestions([]);
    }
  };

  const refetchWithFilters = (newFilters: { participationType: string[], sortBy: string , society_hub_id: [] }) => {
    setFilters(newFilters);
    refetch();
  };

  useEffect(() => {
    if (searchResults) {
      setAutoSuggestions(searchResults.data || []);
    }
  }, [searchResults]);

  return {
    searchTerm,
    setSearchTerm,
    autoSuggestions,
    setAutoSuggestions,
    searchLoading,
    handleSearchChange,
    refetchWithFilters,
  };
};
