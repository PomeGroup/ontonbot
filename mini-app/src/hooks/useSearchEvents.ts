import React, { useState, useEffect, useCallback } from "react";
import { debounce } from "lodash";
import searchEventsInputZod from "@/zodSchema/searchEventsInputZod";
import { trpc } from "@/app/_trpc/client";
export const useSearchEvents = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [autoSuggestions, setAutoSuggestions] = useState<any>({});
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
          setAutoSuggestions(data );
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
        limit: 5,
        offset: 0,
        search: value,
      }).then((r) => r);
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

  useEffect(() => {
    if (searchResults) {
      setAutoSuggestions(searchResults);
      console.log("Search results:", searchResults);
    }
  }, [searchResults]);

  return {
    searchTerm,
    autoSuggestions,
    searchLoading,
    handleSearchChange,
  };
};
