import { createContext, useContext } from "react";
import { RouterOutput } from "@/server";
import { UseTRPCQueryResult } from "@trpc/react-query/shared";

// Create a context for event data
export const EventDataContext = createContext<{
  eventData: UseTRPCQueryResult<RouterOutput['events']['getEvent'], unknown>;
  isNotEnded: boolean;
  isStarted: boolean;
  endUTC: number;
  startUTC: number;
  location: string | undefined | null;
  success: boolean;
  initData: string;
  eventHash: string
} | null>(null);


/**
 * Use event data within EventDataProvider
*/
export const useEventData = () => {
  const context = useContext(EventDataContext);
  if (!context) {
    throw new Error("useEventData must be used within an EventDataProvider");
  }
  return context;
};
