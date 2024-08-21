"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { IoSearchOutline, IoCloseOutline } from "react-icons/io5";
import EventSearchSuggestion from "@/app/_components/EventSearchSuggestion";
import { useSearchEvents } from "@/hooks/useSearchEvents";
import useWebApp from "@/hooks/useWebApp";
import { trpc } from "@/app/_trpc/client";
import EventTypeDrawer from "./EventTypeDrawer";
import HubSelectorDrawer from "./HubSelectorDrawer";
import MainFilterDrawer from "./MainFilterDrawer";

interface SearchBarProps {
  includeQueryParam?: boolean;
}

interface Hub {
  id: string;
  name: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ includeQueryParam = true }) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [participationType, setParticipationType] = useState<string[]>([
    "online",
    "in_person",
  ]);
  const [selectedHubs, setSelectedHubs] = useState<string[]>([]);
  const [hubText, setHubText] = useState<string>("All"); // To track the displayed hub text
  const [sortBy, setSortBy] = useState<string>("start_date_asc"); // Default to "Time"
  const [showFilterButton, setShowFilterButton] = useState(true);
  const [isEventTypeDrawerOpen, setIsEventTypeDrawerOpen] = useState(false);
  const [isHubDrawerOpen, setIsHubDrawerOpen] = useState(false);
  const webApp = useWebApp();
  const hubsResponse = trpc.events.getHubs.useQuery();

  const hubs = hubsResponse.data?.hubs || [];
  const {
    searchTerm,
    setSearchTerm,
    autoSuggestions,
    setAutoSuggestions,
    handleSearchChange,
  } = useSearchEvents();

  useEffect(() => {
    if (includeQueryParam) {
      const participationType = searchParams
        .get("participationType")
        ?.split(",") || ["online", "in_person"];
      const selectedHubs = searchParams.get("selectedHubs")?.split(",") || [];
      const sortBy = searchParams.get("sortBy") || "start_date_asc"; // Default to "Time"
      const searchTerm = searchParams.get("query") || "";
      setSearchTerm(searchTerm);
      setParticipationType(participationType);
      setSelectedHubs(selectedHubs);
      setSortBy(sortBy);
    }
  }, [searchParams]);

  useEffect(() => {
    // Update hub text whenever selectedHubs changes or if no hubs are selected
    if (selectedHubs.length === 0 || selectedHubs.length === hubs.length) {
      setHubText("All");
    } else {
      const selectedHubNames = selectedHubs
        .map((hubId) => hubs.find((hub: Hub) => hub.id === hubId)?.name)
        .filter(Boolean)
        .join(", ");
      setHubText(selectedHubNames);
    }
  }, [selectedHubs, hubs]);

  const handleCloseSuggestions = () => {
    setShowSuggestions(false);
    setShowFilterButton(true);
  };

  const handleSearchInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const isFocused = document.activeElement === event.target;
    setShowFilterButton(!isFocused);
    handleSearchChange(event);
    setShowSuggestions(event.target.value.length > 2);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      handleFilterApply();
    }
  };

  const handleFilterApply = () => {
    const queryParams = new URLSearchParams({
      query: searchTerm,
      participationType: participationType.join(","),
      selectedHubs: selectedHubs.join(","),
      sortBy: sortBy,
    });

    if (!includeQueryParam) {
      router.push(`/search?${queryParams.toString()}`);
    } else {
      window.location.href = `/search?${queryParams.toString()}`;
      return false;
    }
  };

  const resetFilters = () => {
    setParticipationType(["online", "in_person"]);
    setSelectedHubs([]);
    setSortBy("start_date_asc"); // Default to "Time" on reset
  };

  const toggleParticipationType = (type: string) => {
    setParticipationType((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleHubSelection = (hubId: string) => {
    setSelectedHubs((prev) =>
      prev.includes(hubId)
        ? prev.filter((id) => id !== hubId)
        : [...prev, hubId]
    );
  };

  const selectAllHubs = () => setSelectedHubs(hubs.map((hub) => hub.id));
  const deselectAllHubs = () => setSelectedHubs([]);

  return (
    <div className="relative flex items-center">
      <div
        className={`flex-grow transition-all duration-300 ${
          searchTerm ? "animate-grow" : "animate-shrink"
        }`}
      >
        <input
          type="text"
          placeholder="Search"
          className="w-full pl-10 pr-10 p-2 rounded-2xl focus:ring-0 focus:outline-none focus:text-zinc-100 transition-width duration-300"
          onChange={handleSearchInputChange}
          onKeyDown={handleKeyDown} // Listen for Enter key
          value={searchTerm}
          onFocus={handleSearchInputChange}
          onBlur={handleSearchInputChange}
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <IoSearchOutline className="text-gray-500 w-5 h-5" />
        </div>
        {!showFilterButton && (
          <IoCloseOutline
            className="absolute right-2 top-1/2 transform -translate-y-1/2 cursor-pointer text-white w-4 h-4 p-1 rounded-full bg-gray-600"
            onClick={handleCloseSuggestions}
          />
        )}
        {showSuggestions && (
          <EventSearchSuggestion
            searchTerm={searchTerm}
            onClose={handleCloseSuggestions}
            autoSuggestions={autoSuggestions}
            setAutoSuggestions={setAutoSuggestions}
            handleFilterApply={handleFilterApply}
          />
        )}
      </div>
      {showFilterButton && (
        <MainFilterDrawer
          isOpen={true}
          onOpenChange={() => {}}
          participationType={participationType}
          hubText={hubText}
          sortBy={sortBy}
          setSortBy={setSortBy}
          setIsEventTypeDrawerOpen={setIsEventTypeDrawerOpen}
          setIsHubDrawerOpen={setIsHubDrawerOpen}
          handleFilterApply={handleFilterApply}
          resetFilters={resetFilters}
        />
      )}

      {/* Event Type Drawer */}
      <EventTypeDrawer
        isOpen={isEventTypeDrawerOpen}
        onOpenChange={setIsEventTypeDrawerOpen}
        participationType={participationType}
        toggleParticipationType={toggleParticipationType}
      />

      {/* Hub Selector Drawer */}
      <HubSelectorDrawer
        isOpen={isHubDrawerOpen}
        onOpenChange={setIsHubDrawerOpen}
        selectedHubs={selectedHubs}
        toggleHubSelection={toggleHubSelection}
        hubs={hubs}
        selectAllHubs={selectAllHubs}
        deselectAllHubs={deselectAllHubs}
      />
    </div>
  );
};

export default SearchBar;
