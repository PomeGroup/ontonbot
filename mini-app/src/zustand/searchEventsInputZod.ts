import { create } from "zustand";
import { z } from "zod";
import searchEventsInputZod from "@/zodSchema/searchEventsInputZod";

// Define TypeScript types from Zod schema
type SearchEventsInput = z.infer<typeof searchEventsInputZod>;
type Filter = NonNullable<SearchEventsInput["filter"]>;

// Define a type for filter updates
type FilterUpdate = Partial<Filter>;

// Define initial state based on default values of the Zod schema
const initialState: SearchEventsInput = {
  limit: 5,
  cursor: 0,
  search: "",
  filter: {
    participationType: ["in_person", "online"],
    organizer_user_id: undefined,
    startDate: undefined,
    startDateOperator: ">=",
    endDate: undefined,
    endDateOperator: "<=",
    event_ids: [],
    event_uuids: [],
    society_hub_id: [],
    user_id: undefined,
    role: undefined,
  },
  sortBy: "start_date_desc",
  useCache: true,
};

// Helper function to update filter
const updateFilter = (state: SearchEventsInput, updates: FilterUpdate): SearchEventsInput => ({
  ...state,
  //@ts-ignore
  filter: state.filter
    ? {
        ...state.filter,
        ...updates,
      }
    : {
        ...initialState.filter,
        ...updates,
      },
});

// Zustand store for managing search events input
const useSearchEventsStore = create<{
  searchInput: SearchEventsInput;
  setSearchInput: (_input: Partial<SearchEventsInput>) => void;
  resetSearchInput: () => void;

  // Existing setters
  setLimit: (_limit: number) => void;
  setOffset: (_offset: number) => void;
  setSearch: (_search: string) => void;
  setSortBy: (_sortBy: SearchEventsInput["sortBy"]) => void;
  setUseCache: (_useCache: boolean) => void;

  // Filter setters
  setFilter: (_filter: Filter) => void;
  setParticipationType: (_participationType: Filter["participationType"]) => void;
  setOrganizerUserId: (_organizer_user_id: Filter["organizer_user_id"]) => void;
  setStartDate: (_startDate: Filter["startDate"]) => void;
  setStartDateOperator: (_startDateOperator: Filter["startDateOperator"]) => void;
  setEndDate: (_endDate: Filter["endDate"]) => void;
  setEndDateOperator: (_endDateOperator: Filter["endDateOperator"]) => void;
  setEventIds: (_event_ids: Filter["event_ids"]) => void;
  setEventUuids: (_event_uuids: Filter["event_uuids"]) => void;
  setSocietyHubId: (_society_hub_id: Filter["society_hub_id"]) => void;
  setUserId: (_user_id: Filter["user_id"]) => void;
  setRole: (_role: Filter["role"]) => void;
  resetFilters: () => void;
}>((set) => ({
  searchInput: initialState,

  setSearchInput: (input) =>
    set((state) => ({
      searchInput: { ...state.searchInput, ...input },
    })),

  resetSearchInput: () => set(() => ({ searchInput: initialState })),
  resetFilters: () =>
    set((state) => ({
      searchInput: { ...state.searchInput, filter: initialState.filter },
    })),
  // Existing setters
  setLimit: (limit) =>
    set((state) => ({
      searchInput: { ...state.searchInput, limit },
    })),
  setOffset: (offset) =>
    set((state) => ({
      searchInput: { ...state.searchInput, offset },
    })),
  setSearch: (search) =>
    set((state) => ({
      searchInput: { ...state.searchInput, search },
    })),
  setSortBy: (sortBy) =>
    set((state) => ({
      searchInput: { ...state.searchInput, sortBy },
    })),
  setUseCache: (useCache) =>
    set((state) => ({
      searchInput: { ...state.searchInput, useCache },
    })),

  // Filter setters
  setFilter: (filter) =>
    set((state) => ({
      searchInput: { ...state.searchInput, filter },
    })),
  setParticipationType: (participationType) =>
    set((state) => ({
      searchInput: updateFilter(state.searchInput, { participationType }),
    })),
  setOrganizerUserId: (organizer_user_id) =>
    set((state) => ({
      searchInput: updateFilter(state.searchInput, { organizer_user_id }),
    })),
  setStartDate: (startDate) =>
    set((state) => ({
      searchInput: updateFilter(state.searchInput, { startDate }),
    })),
  setStartDateOperator: (startDateOperator) =>
    set((state) => ({
      searchInput: updateFilter(state.searchInput, { startDateOperator }),
    })),
  setEndDate: (endDate) =>
    set((state) => ({
      searchInput: updateFilter(state.searchInput, { endDate }),
    })),
  setEndDateOperator: (endDateOperator) =>
    set((state) => ({
      searchInput: updateFilter(state.searchInput, { endDateOperator }),
    })),
  setEventIds: (event_ids) =>
    set((state) => ({
      searchInput: updateFilter(state.searchInput, { event_ids }),
    })),
  setEventUuids: (event_uuids) =>
    set((state) => ({
      searchInput: updateFilter(state.searchInput, { event_uuids }),
    })),
  setSocietyHubId: (society_hub_id) =>
    set((state) => ({
      searchInput: updateFilter(state.searchInput, { society_hub_id }),
    })),
  setUserId: (user_id) =>
    set((state) => ({
      searchInput: updateFilter(state.searchInput, { user_id }),
    })),
  setRole: (role) =>
    set((state) => ({
      searchInput: updateFilter(state.searchInput, { role }),
    })),
}));

export default useSearchEventsStore;
