"use client";
import React, { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  IoChevronBackOutline,
  IoChevronForwardOutline,
  IoCloseOutline,
  IoSearchOutline,
} from "react-icons/io5";
import EventSearchSuggestion from "@/app/_components/EventSearchSuggestion";
import { useSearchEvents } from "@/hooks/useSearchEvents";
import useWebApp from "@/hooks/useWebApp";
import { trpc } from "@/app/_trpc/client";
import EventTypeDrawer from "./EventTypeDrawer";
import HubSelectorDrawer from "./HubSelectorDrawer";
import MainFilterDrawer from "./MainFilterDrawer";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import searchEventsInputZod from "@/zodSchema/searchEventsInputZod";

interface SearchBarProps {
  includeQueryParam?: boolean;
  showFilterTags?: boolean;
}

interface Hub {
  id: string;
  name: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  includeQueryParam = true,
  showFilterTags = false,
}) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [participationType, setParticipationType] = useState<string[]>([
    "online",
    "in_person",
  ]);
  const [selectedHubs, setSelectedHubs] = useState<string[]>([]);
  const [hubText, setHubText] = useState<string>("All");
  const [sortBy, setSortBy] = useState<string>("start_date_asc");
  const [showFilterButton, setShowFilterButton] = useState(true);
  const [isEventTypeDrawerOpen, setIsEventTypeDrawerOpen] = useState(false);
  const [isHubDrawerOpen, setIsHubDrawerOpen] = useState(false);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const webApp = useWebApp();
  const hubsResponse = trpc.events.getHubs.useQuery();
  const searchRefetch = trpc.events.getEventsWithFilters.useQuery({}, { enabled: false });
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const hubs: Hub[] = hubsResponse.data?.hubs || [];
  const {
    searchTerm,
    setSearchTerm,
    autoSuggestions,
    setAutoSuggestions,
    handleSearchChange,
    refetchWithFilters,
  } = useSearchEvents();

  const [initialHubsSet, setInitialHubsSet] = useState(false);
  const [pageinit, setPageinit] = useState(false);
  useEffect(() => {
    if (includeQueryParam && hubs.length > 0 && !initialHubsSet) {
      const participationType = searchParams
        .get("participationType")
        ?.split(",") || ["online", "in_person"];
      const selectedHubsFromParams =
        searchParams.get("selectedHubs")?.split(",") || [];
      const sortBy = searchParams.get("sortBy") || "start_date_asc";
      const searchTerm = searchParams.get("query") || "";

      setSearchTerm(searchTerm);
      setParticipationType(participationType);
      setSortBy(sortBy);

      if (selectedHubsFromParams.length === 0) {
        setSelectedHubs(hubs.map((hub: Hub) => hub.id));
      } else {
        setSelectedHubs(selectedHubsFromParams);
      }

      setInitialHubsSet(true);
      setTimeout(() => {
        setPageinit(true);
      }, 0);
    }
  }, [searchParams, hubs, includeQueryParam, initialHubsSet]);

  useEffect(() => {
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
    const searchValue = event.target.value;
    setSearchTerm(searchValue);

    if (searchValue.length > 2) {
      handleFilterApply();
    } else {
      setAutoSuggestions([]);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      handleFilterApply();
    }
  };

  const handleFilterApply = async () => {
    const queryParams = new URLSearchParams({
      query: searchTerm,
      participationType: participationType.join(","),
      selectedHubs: selectedHubs.join(","),
      sortBy: sortBy,
    });

    if (!includeQueryParam) {
      router.push(`/search?${queryParams.toString()}`);
      // const response = await trpc.events.getEventsWithFilters.query({
      //   query: searchTerm,
      //   participationType: participationType.filter(Boolean),
      //   selectedHubs,
      //   sortBy,
      // });
        //// it must set the data to the searchResults
    } else {

      window.location.href = `/search?${queryParams.toString()}`;
    }
  };

  const resetFilters = () => {
    const allHubs = hubs.map((hub: Hub) => hub.id);
    setParticipationType(["online", "in_person"]);
    setSelectedHubs(allHubs);
    setSortBy("start_date_asc");
    handleFilterApply();
  };

  const toggleParticipationType = (type: string) => {
    const updated = participationType.includes(type)
      ? participationType.filter((t) => t !== type)
      : [...participationType, type];
    setParticipationType(updated);
  };

  const toggleHubSelection = (hubId: string) => {
    setSelectedHubs((prev) => {
      return prev.includes(hubId)
        ? prev.filter((id) => id !== hubId)
        : [...prev, hubId];
    });
  };

  const selectAllHubs = () => {
    const allHubs = hubs.map((hub: Hub) => hub.id);
    setSelectedHubs(allHubs);
    handleFilterApply();
  };

  const deselectAllHubs = () => {
    setSelectedHubs([]);
    handleFilterApply();
  };

  const clearFilter = (filter: string) => {
    if (participationType.includes(filter)) {
      toggleParticipationType(filter);
    } else if (selectedHubs.includes(filter)) {
      toggleHubSelection(filter);
    } else if (filter === "Sort by Most People Reached") {
      setSortBy("start_date_asc");
    }

    //setTimeout(handleFilterApply, 0);
  };
  useEffect(() => {
    if (pageinit) {
      handleFilterApply();
    }
  }, [participationType, selectedHubs, sortBy]);
  const renderFilterButtons = () => {
    const filters = [
      ...participationType,
      sortBy !== "start_date_asc" ? "Sort by Most People Reached" : null,
    ].filter(Boolean); // Filter out false values

    const filterButtons = filters.map((filter, index) => (
      <Button
        key={index}
        variant="outline"
        className="flex items-center whitespace-nowrap"
        onClick={() => clearFilter(filter!)}
      >
        <span className="text-sm">{filter}</span>
        <IoCloseOutline className="ml-2 w-4 h-4" />
      </Button>
    ));

    if (selectedHubs.length > 0) {
      selectedHubs.forEach((hubId, index) => {
        const hubName = hubs.find((hub) => hub.id === hubId)?.name;
        filterButtons.push(
          <Button
            key={`hub-${index}`}
            variant="outline"
            className="flex items-center whitespace-nowrap"
            onClick={() => clearFilter(hubId)}
          >
            <span className="text-sm">{hubName}</span>
            <IoCloseOutline className="ml-2 w-4 h-4" />
          </Button>
        );
      });
    }

    return filterButtons;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const scrollArea = scrollAreaRef.current;
    if (scrollArea) {
      scrollArea.dataset.isDragging = "true";
      scrollArea.dataset.startX = `${e.pageX - scrollArea.offsetLeft}`;
      scrollArea.dataset.scrollLeft = `${scrollArea.scrollLeft}`;
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const scrollArea = scrollAreaRef.current;
    if (scrollArea && scrollArea.dataset.isDragging === "true") {
      const x = e.pageX - scrollArea.offsetLeft;
      const walk = x - Number(scrollArea.dataset.startX!);
      scrollArea.scrollLeft = Number(scrollArea.dataset.scrollLeft!) - walk;
    }
  };

  const handleMouseUp = () => {
    const scrollArea = scrollAreaRef.current;
    if (scrollArea) {
      scrollArea.dataset.isDragging = "false";
    }
  };

  const checkScrollArrows = () => {
    const scrollArea = scrollAreaRef.current;
    if (scrollArea) {
      setShowLeftArrow(scrollArea.scrollLeft > 0);
      setShowRightArrow(
        scrollArea.scrollLeft < scrollArea.scrollWidth - scrollArea.clientWidth
      );
    }
  };

  useEffect(() => {
    checkScrollArrows(); // Check scroll arrows on initial render
  }, [selectedHubs, participationType, sortBy]);

  return (
    <div className="relative flex flex-col space-y-4">
      <div className="relative flex items-center">
        <div
          className={`flex-grow transition-all duration-300 ${
            searchTerm ? "animate-grow" : "animate-shrink"
          }`}
        >
          <input
            type="text"
            placeholder="Search"
            className="w-full pl-10 pr-10 p-2 rounded-2xl bg-gray-800 text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-blue-600 focus:outline-none transition-width duration-300"
            onChange={handleSearchInputChange}
            onKeyDown={handleKeyDown}
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
      </div>

      {showFilterTags && (
        <div className="relative">
          {showLeftArrow && (
            <div className="absolute left-0 top-0 bottom-0 z-10 flex items-center">
              <Button
                variant="outline"
                className="p-1"
                onClick={() => {
                  if (scrollAreaRef.current) {
                    scrollAreaRef.current.scrollBy({
                      left: -100,
                      behavior: "smooth",
                    });
                  }
                }}
              >
                <IoChevronBackOutline className="w-4 h-4" />
              </Button>
            </div>
          )}

          <ScrollArea
            className="w-full overflow-x-auto rounded-md border-0"
            ref={scrollAreaRef}
            onScroll={checkScrollArrows}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            <div className="flex w-max space-x-2 p-2">
              {renderFilterButtons()}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          {showRightArrow && (
            <div className="absolute right-0 top-0 bottom-0 z-10 flex items-center">
              <Button
                variant="outline"
                className="p-1"
                onClick={() => {
                  if (scrollAreaRef.current) {
                    scrollAreaRef.current.scrollBy({
                      left: 100,
                      behavior: "smooth",
                    });
                  }
                }}
              >
                <IoChevronForwardOutline className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      <EventTypeDrawer
        isOpen={isEventTypeDrawerOpen}
        onOpenChange={setIsEventTypeDrawerOpen}
        participationType={participationType}
        toggleParticipationType={toggleParticipationType}
      />

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
