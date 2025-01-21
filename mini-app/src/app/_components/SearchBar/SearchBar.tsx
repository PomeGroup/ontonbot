"use client";

import React, {
  useEffect,
  useState,
  ChangeEvent,
  useMemo,
} from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { z } from "zod";

import searchEventsInputZod from "@/zodSchema/searchEventsInputZod";

import useWebApp from "@/hooks/useWebApp";

import MainFilterDrawer from "./MainFilterDrawer";
import EventTypeDrawer from "./EventTypeDrawer";
import HubSelectorDrawer from "./HubSelectorDrawer";
import ParticipantErrorDialog from "@/app/_components/SearchBar/ParticipantErrorDialog";

import { SearchIcon } from "lucide-react";
import { typographyClassNameMappings } from "@/components/Typography";
import { useDebouncedCallback } from "@mantine/hooks";
import parseSearchParams, { allParticipationTypes } from "@/app/search/parseSearchParams";
import { trpc } from "@/app/_trpc/client";

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

const buildQueryParams = (newVals: ReturnType<typeof parseSearchParams>) => {
  const pType = (
    Array.isArray(newVals.filter.participationType) ?
      newVals.filter.participationType :
      allParticipationTypes
  ).join(",")

  return new URLSearchParams({
    query: newVals.search,
    participationType: pType,
    selectedHubs: (newVals.filter.society_hub_id).join(","),
    sortBy: newVals.sortBy,
  });
};

function SearchBar() {
  const [showDialogParticipantError, setShowDialogParticipantError] = useState(false);

  const [isEventTypeDrawerOpen, setIsEventTypeDrawerOpen] = useState(false);
  const [isHubDrawerOpen, setIsHubDrawerOpen] = useState(false);

  const router = useRouter();
  const webApp = useWebApp();
  const hapticFeedback = webApp?.HapticFeedback;
  const userId = webApp?.initDataUnsafe?.user?.id || 0;
  const searchParams = useSearchParams();

  /** ---------------
   *  Hubs from API
   * ---------------
   */
  const { data: { hubs } = { hubs: [] } } = trpc.hubs.getHubs.useQuery(undefined, {
    staleTime: Infinity,
    queryKey: ["hubs.getHubs", undefined],
  });

  const isSearchPage = usePathname().includes('/search')

  const parsedSearchParams = useMemo(() => parseSearchParams(searchParams), [searchParams])
  const {
    filter: {
      participationType: participationTypeLocal,
    }
  } = parsedSearchParams

  const defaultFilters = {
    search: '',
    sortBy: 'default' as SortBy,
    filter: {
      participationType: allParticipationTypes,
      society_hub_id: hubs.map(h => h.id).map(Number)
    }
  }
  const [localFilters, setLocalFilters] = useState<ReturnType<typeof parseSearchParams>>(defaultFilters)

  useEffect(() => {
    setLocalFilters(parsedSearchParams)
  }, [parsedSearchParams])


  const applyFilters = (newVals: ReturnType<typeof parseSearchParams>) => {
    const qs = buildQueryParams({
      ...defaultFilters,
      ...newVals,
      filter: {
        ...defaultFilters.filter,
        ...newVals.filter
      }
    });

    const searchUrl = `/search?${qs.toString()}`
    if (!isSearchPage) {
      router.push(searchUrl);
    } else {
      router.replace(searchUrl)
    }
  };

  const _handleSearchInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const val = event.target.value;

    applyFilters({ search: val } as any)
  };

  const handleSearchInputChange = useDebouncedCallback(_handleSearchInputChange, 300)

  /** ---------------
   *  Reset all filters
   * ---------------
   */
  const resetFilters = () => {
    applyFilters(defaultFilters)
    hapticFeedback?.selectionChanged();
  };

  /** ---------------
   *  (Drawer) setParticipationTypes
   * ---------------
   */
  const setParticipationTypes = (types: ParticipationType) => {
    hapticFeedback?.selectionChanged();
    if (types.length === 0) {
      setLocalFilters({ filter: { participationType: allParticipationTypes } } as any)
      return;
    }
    setLocalFilters(prev => ({ ...prev, filter: { ...prev.filter, participationType: types } } as any))
  };

  const setSelectedHubsArray = (hubIds: string[]) => {
    console.log(hubIds)
    if (hubIds.length === 0) {
      setLocalFilters(prev => ({ ...prev, filter: { ...prev.filter, society_hub_id: hubs.map(h => h.id) } } as any))
    } else {
      setLocalFilters(prev => ({ ...prev, filter: { ...prev.filter, society_hub_id: hubIds } } as any))
    }
  };

  /** ---------------
   *  "Show all" participant error
   * ---------------
   */
  const handleShowAll = () => {
    setParticipationTypes([])
    setShowDialogParticipantError(false);
  };

  const { filter: { society_hub_id: selectedHubs } } = localFilters
  let hubText = 'All'
  if (selectedHubs?.length !== 0 && selectedHubs.length !== hubs.length) {
    hubText = selectedHubs
      .map((hubId: number) => hubs.find((h) => h.id === String(hubId))?.name)
      .filter(Boolean)
      .join(", ");
  }

  return (
    <div className="relative flex flex-col">
      {/* Top row: search + filter icon */}
      <div className="relative flex items-center">
        <div
          className={`flex-grow transition-all duration-300`}
        >
          <div className='relative mr-3 text-[#8e8e93] focus-within:text-[#007aff]'>
            <SearchIcon className="absolute top-[6px] left-2 z-2" />
            <input
              className={`rounded-md bg-[#E0E0E5] w-full py-2 pl-10 caret-[#007aff] text-black ${typographyClassNameMappings.body} !font-normal`}
              placeholder="Search Events and Organizers"
              onChange={handleSearchInputChange}
            />
          </div>
        </div>
        <MainFilterDrawer
          hubText={hubText}
          setIsEventTypeDrawerOpen={setIsEventTypeDrawerOpen}
          setIsHubDrawerOpen={setIsHubDrawerOpen}
          resetFilters={resetFilters}
          applyFilters={() => applyFilters(localFilters)}
          participationType={localFilters.filter.participationType}
          sortBy={localFilters.sortBy}
          setSortBy={(newSort: SortBy) => setLocalFilters(prev => ({
            ...prev,
            sortBy: newSort
          }))}
        />
      </div>

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
        selectedHubs={selectedHubs.map(String)}
        setSelectedHubs={setSelectedHubsArray}
        hubs={hubs}
      />

      {/* If user tries removing both 'online' + 'in_person' */}
      <ParticipantErrorDialog
        open={showDialogParticipantError}
        onClose={() => setShowDialogParticipantError(false)}
        onConfirm={handleShowAll}
      />
    </div>
  );
};

export default SearchBar;
