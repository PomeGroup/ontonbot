import useSearchEventsStore from "@/zustand/searchEventsInputZod";
import searchEventsInputZod from "@/zodSchema/searchEventsInputZod";
import { z } from "zod"; // Import your Zustand store
export type SortByType = z.infer<typeof searchEventsInputZod>["sortBy"];

const applyTabFilter = (tabValue: string, userId: number | undefined) => {
  const {
    searchInput,
    setStartDate,
    setStartDateOperator,
    setEndDate,
    setEndDateOperator,
    setUserId,
    setSortBy,
  } = useSearchEventsStore.getState(); // Access Zustand store methods
  // const store = useSearchEventsStore.getState();
  // let newState = { ...store.searchInput };
  // Apply filter logic based on the tab value
  switch (tabValue) {
    case "Upcoming":
      setEndDate(undefined); // No end date for upcoming events
      setStartDate(Math.floor(Date.now() / 1000)); // Start date is current timestamp
      setStartDateOperator(">="); // Start date operator
      setUserId(undefined); // Remove any specific user ID filter
      if (!searchInput.sortBy || searchInput.sortBy === "start_date_desc")
        setSortBy("start_date_asc"); // Default sort order for upcoming events
      break;

    case "Past":
      setStartDate(undefined); // No start date for past events
      setEndDate(Math.floor(Date.now() / 1000)); // End date is the current timestamp
      setEndDateOperator("<="); // End date operator
      setUserId(undefined); // Remove any specific user ID filter
      if (!searchInput.sortBy) setSortBy("start_date_desc"); // Default sort order for past events
      break;

    case "OnGoing":
      setStartDate(Math.floor(Date.now() / 1000)); // Start date is the current timestamp
      setStartDateOperator("<="); // Start date operator
      setEndDate(Math.floor(Date.now() / 1000)); // End date is the current timestamp
      setEndDateOperator(">="); // End date operator
      setUserId(undefined); // Remove any specific user ID filter
      if (!searchInput.sortBy) setSortBy("start_date_desc"); // Default sort order for ongoing events
      break;

    case "MyEvents":
      setStartDate(undefined); // No start date for user events
      setEndDate(undefined); // No end date for user events

      setUserId(Number(userId)); // Set the user ID for filtering "My Events"
      if (!searchInput.sortBy) setSortBy("start_date_desc"); // Default sort order for user events
      break;

    default:
      setStartDate(undefined); // Reset start date
      setEndDate(undefined); // Reset end date
      setUserId(undefined); // Remove any specific user ID filter
      if (!searchInput.sortBy) setSortBy("start_date_desc"); // Default sort order for all events
      break;
  }
  // store.setSearchInput(newState);

  // return newState;
};

export default applyTabFilter;
