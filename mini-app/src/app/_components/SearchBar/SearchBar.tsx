"use client";
import EventSearchSuggestion from "@/app/_components/EventSearchSuggestion";
import ParticipantErrorDialog from "@/app/_components/SearchBar/ParticipantErrorDialog";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useSearchEvents } from "@/hooks/useSearchEvents";
import useWebApp from "@/hooks/useWebApp";
import searchEventsInputZod from "@/zodSchema/searchEventsInputZod";
import useSearchEventsStore from "@/zustand/searchEventsInputZod";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  IoChevronBackOutline,
  IoChevronForwardOutline,
  IoCloseOutline,
  IoSearchOutline,
} from "react-icons/io5";
import { z } from "zod";
import EventTypeDrawer from "./EventTypeDrawer";
import HubSelectorDrawer from "./HubSelectorDrawer";
import MainFilterDrawer from "./MainFilterDrawer";
import { useGetHubs } from "@/hooks/events.hooks";

interface SearchBarProps {
  includeQueryParam?: boolean;
  showFilterTags?: boolean;
  onUpdateResults: (_data: any) => void;
  offset?: number;
  setOffset?: (_offset: number) => void;
  searchParamsParsed?: any;
  setSearchParamsParsed?: (_value: any) => void;
  refetch?: () => void;
  setFinalSearchInput?: (_value: any) => void;
  tabValue?: string;
  applyTabFilter?: (_tabValue: string, _userId: any) => void;
  userRole?: "admin" | "user" | "organizer";
  refetchEvents?: () => void;
}

interface Hub {
  id: string;
  name: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  includeQueryParam = true,
  showFilterTags = false,
  onUpdateResults = () => {},
  setOffset = () => {},
  setFinalSearchInput = () => {},
  tabValue = "All",
  applyTabFilter = (_tabValue: string, _userId: number) => {},
  userRole = "user",
  refetchEvents = () => {},
}) => {
  const {
    searchInput,
    setSearchInput: storeSetSearchInput,
    setParticipationType: storeSetParticipationType,
    setFilter: storeSetSelectedHubs,
    setSortBy: storeSetSortBy,
  } = useSearchEventsStore();
  type SearchEventsInput = z.infer<typeof searchEventsInputZod>;
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  // get pathname

  const webApp = useWebApp();

  const UserId = webApp?.initDataUnsafe?.user?.id || 0;
  type SortBy = SearchEventsInput["sortBy"];
  type ParticipationType = NonNullable<SearchEventsInput["filter"]>["participationType"];
  type SocietyHubId = NonNullable<SearchEventsInput["filter"]>["society_hub_id"];
  const [sortBy, setSortBy] = useState<SortBy>(searchInput?.sortBy ? searchInput.sortBy : "start_date_desc");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showDialogParticipantError, setShowDialogParticipantError] = useState(false);
  const allParticipationTypes: ParticipationType = ["online", "in_person"];
  const [participationType, setParticipationType] = useState<ParticipationType>(["online", "in_person"]);

  const [selectedHubs, setSelectedHubs] = useState<string[]>([]);
  const [applyingFilters, setApplyingFilters] = useState(false);
  const [hubText, setHubText] = useState<string>("All");
  const [showFilterButton, setShowFilterButton] = useState(true);
  const [isEventTypeDrawerOpen, setIsEventTypeDrawerOpen] = useState(false);
  const [isHubDrawerOpen, setIsHubDrawerOpen] = useState(false);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [searchIsFocused, setSearchIsFocused] = useState(false);
  const hubsResponse = useGetHubs();
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [renderedFilterTags, setRenderedFilterTags] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const WebApp = useWebApp();
  const hapticFeedback = WebApp?.HapticFeedback;

  const [HideMainButton, setHideMainButton] = useState(false);

  useEffect(() => {
    if (hubsResponse?.data?.status === "success") {
      const hubsData = hubsResponse.data.hubs; // TypeScript knows hubs exists here
      setHubs((prevHubs) => {
        if (JSON.stringify(prevHubs) !== JSON.stringify(hubsData)) {
          return hubsData;
        }
        return prevHubs;
      });
    }
  }, [hubsResponse.data?.status]);

  const { searchTerm, setSearchTerm, autoSuggestions, setAutoSuggestions } = useSearchEvents();

  const [initialHubsSet, setInitialHubsSet] = useState(false);
  // const [pageInit, setPageInit] = useState(false);

  useEffect(() => {
    if (includeQueryParam && hubs.length > 0 && !initialHubsSet) {
      const participantFromQuery = searchParams.get("participationType")?.split(",") || [];
      const participationType =
        participantFromQuery.length > 0 && participantFromQuery.length !== 2 ? participantFromQuery : [];

      const selectedHubsFromParams = searchParams.get("selectedHubs")?.split(",") || [];
      const sortBy = searchParams.get("sortBy") || "start_date_desc";
      const searchTerm = searchParams.get("query") || "";

      setSearchTerm(searchTerm);
      storeSetSearchInput({ search: searchTerm });
      //@ts-ignore
      setParticipationType(participationType);
      //@ts-ignore
      storeSetParticipationType(participationType);
      //@ts-ignore
      setSortBy(sortBy);

      if (selectedHubsFromParams.length === 0) {
        setSelectedHubs(hubs.map((hub: Hub) => hub.id));
      } else {
        setSelectedHubs(selectedHubsFromParams);
      }

      setInitialHubsSet(true);
      // setTimeout(() => {
      //   setPageInit(true);
      // }, 0);
    } else if (hubs.length > 0 && !includeQueryParam && !initialHubsSet) {
      setSelectedHubs(hubs.map((hub: Hub) => hub.id));
      setInitialHubsSet(true);
      // setTimeout(() => {
      //   setPageInit(true);
      // });
    }
  }, [searchParams, hubs, includeQueryParam, initialHubsSet]);

  useEffect(() => {
    if (selectedHubs.length === 0 || selectedHubs.length === hubs.length) {
      setHubText("All");
      // setSelectedHubs(hubs.map((hub: Hub) => hub.id));
    } else {
      const selectedHubNames = selectedHubs
        .map((hubId) => hubs.find((hub: Hub) => hub.id === hubId)?.name)
        .filter(Boolean)
        .join(", ");
      setHubText(selectedHubNames);
    }
  }, [selectedHubs, hubs]);

  const handleCloseSuggestions = () => {
    setSearchTerm("");
    setShowSuggestions(false);
    setShowFilterButton(true);
  };

  const handleSearchInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const searchValue = event.target.value;
    // check is focus
    const isFocus = event.target === document.activeElement;
    setSearchIsFocused(isFocus);
    setSearchTerm(searchValue);
    storeSetSearchInput({ search: searchValue });
    storeSetSortBy(sortBy);
    if (searchValue.length > 2) {
      setShowSuggestions(true);
      setShowFilterButton(false);
      handleFilterApply().then((r) => {
        // console.log(r);
      });
    } else {
      setAutoSuggestions([]);
      setShowSuggestions(false);
      setShowFilterButton(true);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      handleFilterApply().then(() => {
        window.location.href = `/search?tab=${tabValue}&${createQueryParams().toString()}`;
        return;
      });
    }
  };
  useEffect(() => {
    if (applyingFilters) {
      // Ensure participationType is only ["online", "in_person"]
      const participationTypeStore = participationType?.filter((type) =>
        allParticipationTypes.includes(type)
      );

      // Ensure selectedHubs are converted from string[] to number[]
      const society_hub_id: SocietyHubId = selectedHubs.map(Number).filter((id) => !isNaN(id)); // Ensure only valid numbers are included
      // @ts-ignore
      storeSetSelectedHubs({ society_hub_id: society_hub_id });
      storeSetParticipationType(participationTypeStore);
      setParticipationType(participationTypeStore);
      // Ensure sortBy is a valid value

      storeSetSortBy(sortBy);
      // Reset applying filters flag
      setApplyingFilters(false);
      storeSetSearchInput({ search: searchInput.search });

      handleFilterApply().then(() => {
        refetchEvents();
      });
    }
  }, [applyingFilters]);

  const handleAutoSuggestionAllResults = () => {
    setAutoSuggestions([]);
    setShowSuggestions(false);
    setShowFilterButton(true);
    const queryParamsRedirect = new URLSearchParams({
      query: searchTerm,
      sortBy: "start_date_desc",
    });
    window.location.href = `/search?tab=${tabValue}&${queryParamsRedirect.toString()}`;
    return;
  };
  const createQueryParams = () => {
    // @ts-ignore
    return new URLSearchParams({
      query: searchTerm,
      participationType:
        participationType && participationType.length
          ? participationType.join(",")
          : allParticipationTypes.join(","),
      selectedHubs: selectedHubs.join(","),
      sortBy: sortBy,
    });
  };
  const handleFilterApply = async () => {
    const queryParams = createQueryParams();

    // if(!applyingFilters) return;

    if (!includeQueryParam && !searchIsFocused) {
      router.push(`/search?${queryParams.toString()}`);
    } else if (includeQueryParam && !searchIsFocused) {
      setRenderedFilterTags(!renderedFilterTags);
      applyTabFilter(tabValue, UserId);
      setOffset(0);
      onUpdateResults([]);

      setFinalSearchInput && setFinalSearchInput(searchInput);
    }
  };

  const resetFilters = () => {
    const allHubs = hubs.map((hub: Hub) => hub.id);
    setParticipationType([]);
    setSelectedHubs(allHubs);
    setSortBy("start_date_desc");
    setRenderedFilterTags(!renderedFilterTags);
    handleFilterApply().then((r) => {
      // console.log(r);
      refetchEvents();
    });
    hapticFeedback?.selectionChanged();
  };
  const setParticipationTypes = (types: ParticipationType) => {
    hapticFeedback?.selectionChanged();

    if (types.length === 0) {
      setParticipationType(["online", "in_person"]);
      return;
    }

    setParticipationType(types);
  };
  const toggleParticipationType = (type: string, triggerFrom = "filter") => {
    hapticFeedback?.selectionChanged();
    console.log("-----***", participationType);
    //@ts-ignore
    const updated = participationType.includes(type)
      ? participationType.filter((t) => t !== type)
      : [...participationType, type];
    setParticipationType(["online", "in_person"]);
    if (
      updated.length === 0 &&
      participationType.includes("online") &&
      participationType.includes("in_person")
    ) {
      return;
    }

    if (updated.length === 0 && triggerFrom === "filter") {
      setShowDialogParticipantError(true);
      return;
    }
    //@ts-ignore
    setParticipationType(updated);
  };

  const toggleHubSelection = (hubId: string) => {
    setSelectedHubs((prev) => {
      return prev.includes(hubId) ? prev.filter((id) => id !== hubId) : [...prev, hubId];
    });
    hapticFeedback?.selectionChanged();
  };
  const setSelectedHubsArray = (hubs: string[]) => {
    if (hubs.length === 0) {
      //@ts-ignore
      setSelectedHubs(hubs.map((hub) => hub.id));
    } else {
      setSelectedHubs(hubs);
    }
    //setApplyingFilters(true);
  };
  // const selectAllHubs = () => {
  //   const allHubs = hubs.map((hub: Hub) => hub.id);
  //   setSelectedHubs(allHubs);
  //   hapticFeedback?.selectionChanged();
  // };
  //
  // const deselectAllHubs = () => {
  //   setSelectedHubs([]);
  //   hapticFeedback?.selectionChanged();
  // };

  const clearFilter = (filter: string) => {
    // @ts-ignore
    if (participationType.includes(filter)) {
      toggleParticipationType(filter, "tag");
    } else if (selectedHubs.includes(filter)) {
      toggleHubSelection(filter);
    } else if (filter === "Most People Reached") {
      setSortBy("start_date_desc");
    }
    setApplyingFilters(true);
    hapticFeedback?.selectionChanged();
  };

  useEffect(() => {
    if ((userRole === "admin" || userRole === "organizer") && pathname === "/") {
      if (HideMainButton) {
        setTimeout(() => {}, 100);
        console.log("+++++HideMainButton isVisible", WebApp?.MainButton.isVisible);
        WebApp?.MainButton.hide();
        WebApp?.MainButton.hide();
      } else if (!HideMainButton) {
        setTimeout(() => {}, 100);
        console.log("++++ShowMainButton isVisible", WebApp?.MainButton.isVisible);
        WebApp?.MainButton.show();
        WebApp?.MainButton.show();
      }
    }
  }, [HideMainButton, WebApp?.MainButton?.isVisible]);
  const renderFilterButtons = useCallback(() => {
    let filters;

    filters = [
      ...(participationType.length > 0
        ? participationType // Use the selected participation type(s)
        : []), // If empty, default to both
      sortBy !== "start_date_desc" ? "Most People Reached" : null,
    ].filter(Boolean); // Filter out falsy values
    const filterButtons = filters.map((filter, index) => (
      <Button
        key={index}
        variant="outline"
        className="flex items-center text-gray-300 p-2 h-4 py-0 text-xs whitespace-nowrap"
        onClick={() => clearFilter(filter!)}
      >
        <span className="text-sm">{filter}</span>
        <IoCloseOutline className="ml-2 w-4 h-4" />
      </Button>
    ));

    if (selectedHubs.length > 0 && selectedHubs.length !== hubs.length) {
      selectedHubs.forEach((hubId, index) => {
        const hubName = hubs.find((hub) => hub.id === hubId)?.name;
        if (!hubName) return;
        filterButtons.push(
          <Button
            key={`hub-${index}`}
            variant="outline"
            className="flex items-center text-gray-300 p-2 h-4 py-0 text-xs  whitespace-nowrap"
            onClick={() => clearFilter(hubId)}
          >
            <span className="text-sm">{hubName}</span>
            <IoCloseOutline className="ml-2 w-4 h-4" />
          </Button>
        );
      });
    }

    return filterButtons;
  }, [renderedFilterTags, participationType]); // Dependencies

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
      setShowRightArrow(scrollArea.scrollLeft < scrollArea.scrollWidth - scrollArea.clientWidth);
    }
  };
  const handleShowAll = () => {
    setParticipationType(["in_person", "online"]);
    setShowDialogParticipantError(false); // Close the dialog after setting the types
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
            placeholder={tabValue === "" ? "Search All Events" : `Search ${tabValue} `}
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
          <ParticipantErrorDialog
            open={showDialogParticipantError}
            onClose={() => setShowDialogParticipantError(false)}
            onConfirm={handleShowAll}
          />
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
              handleAutoSuggestionAllResults={handleAutoSuggestionAllResults}
            />
          )}
        </div>
        {showFilterButton && (
          <MainFilterDrawer
            onOpenChange={setHideMainButton}
            participationType={participationType}
            hubText={hubText}
            sortBy={sortBy}
            // @ts-ignore
            setSortBy={setSortBy}
            setIsEventTypeDrawerOpen={setIsEventTypeDrawerOpen}
            setIsHubDrawerOpen={setIsHubDrawerOpen}
            setApplyingFilters={setApplyingFilters}
            applyingFilters={applyingFilters}
            resetFilters={resetFilters}
            allParticipationTypes={allParticipationTypes}
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
            <div className="flex w-max space-x-2 p-2 pt-0">{renderFilterButtons()}</div>
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
        setParticipationTypes={setParticipationTypes}
      />

      <HubSelectorDrawer
        isOpen={isHubDrawerOpen}
        onOpenChange={setIsHubDrawerOpen}
        selectedHubs={selectedHubs}
        setSelectedHubs={setSelectedHubsArray}
        hubs={hubs}
      />
    </div>
  );
};

export default SearchBar;
