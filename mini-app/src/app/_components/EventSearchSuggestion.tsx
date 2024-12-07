import React, { useCallback, useEffect, useState, useRef } from "react";
import EventCard from "@/app/_components/EventCard/EventCard";
import { trpc } from "@/app/_trpc/client";
import searchEventsInputZod from "@/zodSchema/searchEventsInputZod";
import { debounce } from "lodash";
import { FaTimes } from "react-icons/fa";
import EventCardSkeleton from "@/app/_components/EventCard/EventCardSkeleton";
import useSearchEventsStore from "@/zustand/searchEventsInputZod";

interface EventSearchSuggestionProps {
  searchTerm: string;
  onClose: () => void;
  autoSuggestions: any[];
  setAutoSuggestions: (_value: any[]) => void;
  handleFilterApply: (_value: any[]) => void;
  handleAutoSuggestionAllResults: (_value: any[]) => void;
}

const EventSearchSuggestion: React.FC<EventSearchSuggestionProps> = ({
  searchTerm,
  onClose,
  autoSuggestions,
  setAutoSuggestions,
  handleAutoSuggestionAllResults,
}) => {
  const [searchLoading, setSearchLoading] = useState(false);
  const suggestionBoxRef = useRef<HTMLDivElement>(null);
  const { searchInput } = useSearchEventsStore();
  const { refetch } = trpc.events.getEventsWithFilters.useQuery(
    searchEventsInputZod.parse({
      limit: 4,
      offset: 0,
      search: searchTerm,
      filter: {
        startDate: searchInput?.filter?.startDate || undefined,
        startDateOperator: searchInput?.filter?.startDateOperator || ">=",
        endDate: searchInput?.filter?.endDate || undefined,
        endDateOperator: searchInput?.filter?.endDateOperator || "<=",
        participationType: searchInput?.filter?.participationType || ["online", "in_person"],
        society_hub_id: searchInput?.filter?.society_hub_id || [],
        user_id: searchInput?.filter?.user_id || undefined,
      },
      sortBy: searchInput?.sortBy || "default",
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
    debounce(() => {
      setSearchLoading(true);
      refetch().then((r) => console.log(r));
    }, 300),
    [refetch]
  );

  useEffect(() => {
    if (searchTerm.length > 2) {
      debouncedFetchSearchResults();
    } else {
      setAutoSuggestions([]);
    }
  }, [searchTerm, debouncedFetchSearchResults]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionBoxRef.current && !suggestionBoxRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  return (
    <div
      ref={suggestionBoxRef}
      className="absolute pt-4 w-full bg-white border-cn-muted border rounded-xl shadow-lg z-50"
    >
      {searchLoading ? (
        <div className="p-2">
          {Array.from({ length: 1 }).map((_, index) => (
            <EventCardSkeleton
              key={index}
              mode="small"
            />
          ))}
        </div>
      ) : autoSuggestions?.length > 0 ? (
        <>
          {autoSuggestions.map((event) => (
            <EventCard
              key={event.event_uuid}
              event={event}
              mode="small"
            />
          ))}
          <button
            className="w-full text-s text-center py-2 h-8 flex items-center justify-center"
            onClick={handleAutoSuggestionAllResults as any}
          >
            <span>All Results</span>
          </button>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between p-2">
            <div className="text-sm">No Results Found</div>
            <button onClick={onClose}>
              <FaTimes />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default EventSearchSuggestion;
