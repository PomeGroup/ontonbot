"use client";

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  MouseEvent,
  ChangeEvent,
  KeyboardEvent,
} from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { z } from "zod";
import { IoChevronBackOutline, IoChevronForwardOutline } from "react-icons/io5";
import { Searchbar } from "konsta/react";

import useSearchEventsStore from "@/zustand/searchEventsInputZod";
import searchEventsInputZod from "@/zodSchema/searchEventsInputZod";

import { useSearchEvents } from "@/hooks/useSearchEvents";
import { useGetHubs } from "@/hooks/events.hooks";
import useWebApp from "@/hooks/useWebApp";

import MainFilterDrawer from "./MainFilterDrawer";
import EventTypeDrawer from "./EventTypeDrawer";
import HubSelectorDrawer from "./HubSelectorDrawer";
import ParticipantErrorDialog from "@/app/_components/SearchBar/ParticipantErrorDialog";
import EventSearchSuggestion from "@/app/_components/EventSearchSuggestion";

import StatusChip from "@/components/ui/status-chips";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

/** Props for the SearchBar component */
interface SearchBarProps {
  /** If true, parse/push query parameters in the URL (e.g., ?query=xxx) */
  includeQueryParam?: boolean;
  /** If true, show the row of filter tags beneath the search bar. */
  showFilterTags?: boolean;
  /** Called whenever we reset or re-fetch results, so the parent can clear or update data */
  onUpdateResults?: (data: any) => void;
  /** Optional offset logic (if still used) */
  offset?: number;
  setOffset?: (_offset: number) => void;
  /** Higher-level input props, if needed */
  searchParamsParsed?: any;
  setSearchParamsParsed?: (_value: any) => void;
  /** Called when we want to refetch from the parent */
  refetch?: () => void;
  /** If you want to store a final copy of the search input in the parent */
  setFinalSearchInput?: (_value: any) => void;
  /** If you have tab filtering (e.g., "All", "Past", etc.) */
  tabValue?: string;
  applyTabFilter?: (_tabValue: string, _userId: number) => void;
  /** The user’s role (admin, user, organizer) if relevant */
  userRole?: "admin" | "user" | "organizer";
  /** Another callback that triggers a re-fetch in the parent */
  refetchEvents?: () => void;
}

/** TypeScript types from your Zod schema */
type SearchEventsInput = z.infer<typeof searchEventsInputZod>;
type FilterType = NonNullable<SearchEventsInput["filter"]>;
type SortBy = SearchEventsInput["sortBy"];
type ParticipationType = FilterType["participationType"];
type SocietyHubId = FilterType["society_hub_id"];

/** For the hubs API response */
interface Hub {
  id: string;
  name: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  includeQueryParam = true,
  showFilterTags = false,
  onUpdateResults = () => { },
  offset = 0,
  setOffset = () => { },
  refetch = () => { },
  setFinalSearchInput = () => { },
  tabValue = "All",
  applyTabFilter = () => { },
  userRole = "user",
  refetchEvents = () => { },
}) => {
  /** ---------------
   *  Zustand Store
   * ---------------
   */
  const {
    searchInput,
    setSearchInput,
    setParticipationType,
    setSocietyHubId,
    setSortBy,
  } = useSearchEventsStore();

  /** ---------------
   *  Local State
   * ---------------
   */
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showDialogParticipantError, setShowDialogParticipantError] = useState(false);
  const allParticipationTypes: ParticipationType = ["online", "in_person"];
  const [participationTypeLocal, setParticipationTypeLocal] = useState<ParticipationType>(
    searchInput.filter?.participationType || ["online", "in_person"]
  );
  const [sortByLocal, setSortByLocal] = useState<SortBy>(searchInput.sortBy || "start_date_desc");
  const [selectedHubs, setSelectedHubs] = useState<string[]>([]);
  const [applyingFilters, setApplyingFilters] = useState(false);
  const [hubText, setHubText] = useState("All");
  const [showFilterButton, setShowFilterButton] = useState(true);
  const [isEventTypeDrawerOpen, setIsEventTypeDrawerOpen] = useState(false);
  const [isHubDrawerOpen, setIsHubDrawerOpen] = useState(false);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [searchIsFocused, setSearchIsFocused] = useState(false);
  const [renderedFilterTags, setRenderedFilterTags] = useState(true);

  const router = useRouter();
  const searchParams = useSearchParams();
  const webApp = useWebApp();
  const hapticFeedback = webApp?.HapticFeedback;
  const userId = webApp?.initDataUnsafe?.user?.id || 0;

  /** ---------------
   *  Hubs from API
   * ---------------
   */
  const hubsResponse = useGetHubs();
  const [hubs, setHubs] = useState<Hub[]>([]);
  useEffect(() => {
    if (hubsResponse.data?.status === "success") {
      const hubsData = hubsResponse.data.hubs;
      setHubs((prev) => {
        if (JSON.stringify(prev) !== JSON.stringify(hubsData)) {
          return hubsData;
        }
        return prev;
      });
    }
  }, [hubsResponse.data?.status]);

  /** ---------------
   *  Search Suggestions
   * ---------------
   */
  const { searchTerm, setSearchTerm, autoSuggestions, setAutoSuggestions } = useSearchEvents();

  /** ---------------
   *  On mount, parse URL if includeQueryParam
   * ---------------
   */
  const [initialHubsSet, setInitialHubsSet] = useState(false);
  useEffect(() => {
    if (!initialHubsSet && hubs.length > 0) {
      if (includeQueryParam) {
        const participantFromQuery = searchParams.get("participationType")?.split(",") || [];
        const maybePType =
          participantFromQuery.length > 0 && participantFromQuery.length !== 2
            ? (participantFromQuery as ParticipationType)
            : [];

        const selectedHubsFromParams = searchParams.get("selectedHubs")?.split(",") || [];
        const sortByQ = (searchParams.get("sortBy") as SortBy) || "start_date_desc";
        const term = searchParams.get("query") || "";

        // local states
        setSearchTerm(term);
        setParticipationTypeLocal(maybePType);
        setSortByLocal(sortByQ);

        // store states
        setSearchInput({ search: term });
        setParticipationType(maybePType);
        setSortBy(sortByQ);

        if (selectedHubsFromParams.length === 0) {
          setSelectedHubs(hubs.map((hub) => hub.id));
        } else {
          setSelectedHubs(selectedHubsFromParams);
        }
      } else {
        // if ignoring query param => default to all
        setSelectedHubs(hubs.map((hub) => hub.id));
      }
      setInitialHubsSet(true);
    }
  }, [hubs, includeQueryParam, initialHubsSet]);

  /** ---------------
   *  Display "All" if no hubs or all selected
   * ---------------
   */
  useEffect(() => {
    if (selectedHubs.length === 0 || selectedHubs.length === hubs.length) {
      setHubText("All");
    } else {
      const selectedNames = selectedHubs
        .map((hubId) => hubs.find((h) => h.id === hubId)?.name)
        .filter(Boolean)
        .join(", ");
      setHubText(selectedNames);
    }
  }, [selectedHubs, hubs]);

  /** ---------------
   *  Searching
   * ---------------
   */

  const handleSearchInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const val = event.target.value;
    const isFocus = event.target === document.activeElement;
    setSearchIsFocused(isFocus);
    setSearchTerm(val);

    // sync store
    setSearchInput({ search: val });
    setSortBy(sortByLocal);

    if (val.length > 2) {
      setShowSuggestions(true);
      setShowFilterButton(false);
    } else {
      setAutoSuggestions([]);
      setShowSuggestions(false);
      setShowFilterButton(true);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      applyFilters().then(() => {
        // navigate to search page with new query

        router.replace(`/search?tab=${tabValue}&${buildQueryParams().toString()}`);
      });
    }
  };

  /** ---------------
   *  build Query Params
   * ---------------
   */
  const buildQueryParams = () => {
    const pType = participationTypeLocal && participationTypeLocal.length
      ? participationTypeLocal.join(",")
      : allParticipationTypes.join(",");

    return new URLSearchParams({
      query: searchTerm,
      participationType: pType,
      selectedHubs: selectedHubs.join(","),
      sortBy: sortByLocal,
    });
  };

  /** ---------------
   *  Filtering
   * ---------------
   */
  const applyFilters = async () => {
    const qs = buildQueryParams();

    if (!includeQueryParam && !searchIsFocused) {
      router.push(`/search?${qs.toString()}`);
    } else if (includeQueryParam && !searchIsFocused) {
      // toggle re-render of filter tags
      setRenderedFilterTags(!renderedFilterTags);
      // apply tab filter if any
      applyTabFilter(tabValue, userId);
      // reset offset if used
      setOffset(0);
      // clear parent data
      onUpdateResults([]);
      // store final input in parent if desired
      setFinalSearchInput?.(searchInput);
    }
  };

  /** ---------------
   *  Re-run filter if applying
   * ---------------
   */
  useEffect(() => {
    if (!applyingFilters) return;

    // ensure local participation is valid
    const validPType = participationTypeLocal?.filter((x) => allParticipationTypes.includes(x));
    setParticipationType(validPType);
    // update store with local sort
    setSortBy(sortByLocal);

    // convert selectedHubs => number[], update store
    const numericHubs: SocietyHubId = selectedHubs.map(Number).filter((id) => !isNaN(id));
    setSocietyHubId(numericHubs);

    setApplyingFilters(false);
    setSearchInput({ search: searchInput.search });

    // after everything, run apply => refetch
    applyFilters().then(() => {
      refetchEvents();
    });
  }, [applyingFilters]);

  /** ---------------
   *  "Show all results" from suggestions
   * ---------------
   */
  const handleAutoSuggestionAllResults = () => {
    setAutoSuggestions([]);
    setShowSuggestions(false);
    setShowFilterButton(true);

    const q = new URLSearchParams({
      query: searchTerm,
      sortBy: "start_date_desc",
    });

    router.replace(`/search?tab=${tabValue}&${q.toString()}`);
  };

  /** ---------------
   *  Close suggestions
   * ---------------
   */
  const handleCloseSuggestions = () => {
    setSearchTerm("");
    setShowSuggestions(false);
    setShowFilterButton(true);
  };

  /** ---------------
   *  Reset all filters
   * ---------------
   */
  const resetFilters = () => {
    const allHubIds = hubs.map((hub) => hub.id);
    setParticipationTypeLocal([]);
    setSelectedHubs(allHubIds);
    setSortByLocal("start_date_desc");
    setRenderedFilterTags(!renderedFilterTags);

    applyFilters().then(() => {
      refetchEvents();
    });
    hapticFeedback?.selectionChanged();
  };

  /** ---------------
   *  (Drawer) setParticipationTypes
   * ---------------
   */
  const setParticipationTypes = (types: ParticipationType) => {
    hapticFeedback?.selectionChanged();
    if (types.length === 0) {
      setParticipationTypeLocal(["online", "in_person"]);
      return;
    }
    setParticipationTypeLocal(types);
  };

  /** ---------------
   *  Toggle single PType
   * ---------------
   */
  function toggleParticipationTypeLocal(
    type: "online" | "in_person",
    triggerFrom = "filter"
  ) {
    hapticFeedback?.selectionChanged();

    // Construct the updated array
    const updated = participationTypeLocal.includes(type)
      ? participationTypeLocal.filter((t) => t !== type)
      : [...participationTypeLocal, type];

    // If user tries to remove both => show error
    if (updated.length === 0 && triggerFrom === "filter") {
      setShowDialogParticipantError(true);
      return;
    }

    // This updated array is guaranteed to remain ("online" | "in_person")[]
    setParticipationTypeLocal(updated);
  }

  /** ---------------
   *  Hub selection toggles
   * ---------------
   */
  const toggleHubSelection = (hubId: string) => {
    hapticFeedback?.selectionChanged();
    setSelectedHubs((prev) => {
      return prev.includes(hubId) ? prev.filter((id) => id !== hubId) : [...prev, hubId];
    });
  };
  const setSelectedHubsArray = (hubIds: string[]) => {
    if (hubIds.length === 0) {
      setSelectedHubs(hubs.map((hub) => hub.id));
    } else {
      setSelectedHubs(hubIds);
    }
  };

  /** ---------------
   *  Remove single chip
   * ---------------
   */
  const clearFilter = (filter: string) => {
    // If it's a participationType
    if ((filter === "online" || filter === "in_person") && participationTypeLocal.includes(filter)) {
      toggleParticipationTypeLocal(filter, "tag");
    }
    // If it's a hub
    else if (selectedHubs.includes(filter)) {
      toggleHubSelection(filter);
    }
    // If it's a sort
    else if (filter === "Most People Reached") {
      setSortByLocal("start_date_desc");
    }

    setApplyingFilters(true);
    hapticFeedback?.selectionChanged();
  }

  /** ---------------
   *  Render filter tags
   * ---------------
   */
  const renderFilterButtons = useCallback(() => {
    // If sortByLocal != "start_date_desc", show "Most People Reached" chip
    const baseFilters: (string | null)[] = [
      ...(participationTypeLocal.length > 0 ? participationTypeLocal : []),
      sortByLocal !== "start_date_desc" ? "Most People Reached" : null,
    ].filter(Boolean);

    const filterButtons = baseFilters.map((f, idx) => (
      <StatusChip
        key={`chip-${f}-${idx}`}
        onDelete={() => clearFilter(f!)}
        label={f!.split("_").join(" ")}
        showDeleteButton
      />
    ));

    // If not "All hubs" => show each hub as chip
    if (selectedHubs.length > 0 && selectedHubs.length !== hubs.length) {
      selectedHubs.forEach((hubId) => {
        const hubName = hubs.find((h) => h.id === hubId)?.name;
        if (!hubName) return;
        filterButtons.push(
          <StatusChip
            key={`hub-${hubId}`}
            onDelete={() => clearFilter(hubId)}
            label={hubName}
            showDeleteButton
          />
        );
      });
    }
    return filterButtons;
  }, [renderedFilterTags, participationTypeLocal, sortByLocal, selectedHubs, hubs]);

  /** ---------------
   *  Scroll-area arrow logic
   * ---------------
   */
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    const scrollArea = scrollAreaRef.current;
    if (!scrollArea) return;
    scrollArea.dataset.isDragging = "true";
    scrollArea.dataset.startX = `${e.pageX - scrollArea.offsetLeft}`;
    scrollArea.dataset.scrollLeft = `${scrollArea.scrollLeft}`;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const scrollArea = scrollAreaRef.current;
    if (scrollArea?.dataset.isDragging === "true") {
      const x = e.pageX - scrollArea.offsetLeft;
      const walk = x - Number(scrollArea.dataset.startX!);
      scrollArea.scrollLeft = Number(scrollArea.dataset.scrollLeft!) - walk;
    }
  };

  const handleMouseUp = () => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.dataset.isDragging = "false";
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

  /** ---------------
   *  "Show all" participant error
   * ---------------
   */
  const handleShowAll = () => {
    setParticipationTypeLocal(["online", "in_person"]);
    setShowDialogParticipantError(false);
  };

  /** On mount (or changes to hubs, pType, sort), check scroll arrows */
  useEffect(() => {
    checkScrollArrows();
  }, [selectedHubs, participationTypeLocal, sortByLocal]);

  return (
    <div className="relative flex flex-col">
      {/* Top row: search + filter icon */}
      <div className="relative flex items-center">
        <div
          className={`flex-grow transition-all duration-300 ${searchTerm ? "animate-grow" : "animate-shrink"
            }`}
        >
          <Searchbar
            className="py-1.5"
            placeholder={
              tabValue === "" ? "Search All Events" : `Search ${tabValue}`
            }
            onChange={handleSearchInputChange}
            onKeyDown={handleKeyDown}
            value={searchTerm}
            onFocus={handleSearchInputChange}
            onBlur={handleSearchInputChange}
          />

          {/* If user tries removing both 'online' + 'in_person' */}
          <ParticipantErrorDialog
            open={showDialogParticipantError}
            onClose={() => setShowDialogParticipantError(false)}
            onConfirm={handleShowAll}
          />

          {/* Auto-suggestions */}
          {showSuggestions && (
            <EventSearchSuggestion
              searchTerm={searchTerm}
              onClose={handleCloseSuggestions}
              autoSuggestions={autoSuggestions}
              setAutoSuggestions={setAutoSuggestions}
              handleFilterApply={applyFilters}
              handleAutoSuggestionAllResults={handleAutoSuggestionAllResults}
            />
          )}
        </div>

        {/* Main filter drawer */}
        {showFilterButton && (
          <MainFilterDrawer
            onOpenChange={() => { }}
            participationType={participationTypeLocal}
            hubText={hubText}
            sortBy={sortByLocal}
            setSortBy={setSortByLocal}
            setIsEventTypeDrawerOpen={setIsEventTypeDrawerOpen}
            setIsHubDrawerOpen={setIsHubDrawerOpen}
            setApplyingFilters={setApplyingFilters}
            applyingFilters={applyingFilters}
            resetFilters={resetFilters}
            allParticipationTypes={allParticipationTypes}
          />
        )}
      </div>

      {/* Filter chips row */}
      {showFilterTags && (
        <div className="relative mt-2">
          {showLeftArrow && (
            <div className="absolute left-0 top-0 bottom-0 z-10 flex items-center">
              <Button
                variant="outline"
                className="p-1"
                onClick={() => {
                  scrollAreaRef.current?.scrollBy({
                    left: -100,
                    behavior: "smooth",
                  });
                }}
              >
                <IoChevronBackOutline className="w-4 h-4" />
              </Button>
            </div>
          )}

          <ScrollArea
            ref={scrollAreaRef}
            className="w-full overflow-x-auto rounded-md border-0"
            onScroll={checkScrollArrows}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            <div className="flex w-max space-x-2 p-2 pt-0">
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
                  scrollAreaRef.current?.scrollBy({
                    left: 100,
                    behavior: "smooth",
                  });
                }}
              >
                <IoChevronForwardOutline className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Drawers */}
      <EventTypeDrawer
        isOpen={isEventTypeDrawerOpen}
        onOpenChange={setIsEventTypeDrawerOpen}
        participationType={participationTypeLocal}
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
