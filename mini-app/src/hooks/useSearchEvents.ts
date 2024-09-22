import React, { useState, useEffect, useCallback } from "react";
import { debounce } from "lodash";
import searchEventsInputZod from "@/zodSchema/searchEventsInputZod";
import { trpc } from "@/app/_trpc/client";
import useSearchEventsStore from "@/zustand/searchEventsInputZod";

export const useSearchEvents = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [autoSuggestions, setAutoSuggestions] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    participationType: ["online", "in_person"],
    sortBy: "default",
    society_hub_id: [],
  });
  const {
    setSearchInput : storeSetSearchInput,
  } = useSearchEventsStore();
  const { data: searchResults, refetch } = trpc.events.getEventsWithFilters.useQuery(
      searchEventsInputZod.parse({
        limit: 3,
        offset: 0,
        search: searchTerm,
        filter: {
          participationType: filters.participationType,
          startDate: Math.floor(Date.now() / 1000) - (Math.floor(Date.now() / 1000) % 600),
          society_hub_id: filters.society_hub_id,
        },
        sortBy: filters.sortBy,
      }),
      {
        enabled: false,
        onSuccess: (data) => {
          setAutoSuggestions(data.data || []);
        },
        onError: () => {
          setAutoSuggestions([]);
        },
      }
  );

  const debouncedFetchSearchResults = useCallback(
      debounce((_value: string) => {
        refetch();
      }, 300),
      [refetch]
  );

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const searchValue = event.target.value;
    setSearchTerm(searchValue);
    storeSetSearchInput({ search: searchValue });

    if (searchValue.length > 2) {
      debouncedFetchSearchResults(searchValue);
    } else {
      setAutoSuggestions([]);
    }
  };

  const refetchWithFilters = (newFilters: Partial<typeof filters>) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      ...newFilters,
    }));
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
    filters,
    setFilters,
    handleSearchChange,
    refetchWithFilters,
  };
};
