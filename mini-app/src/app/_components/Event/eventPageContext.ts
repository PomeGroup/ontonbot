import { createContext, useContext } from "react";
import { RouterOutput } from "@/server";
import { UseTRPCQueryResult } from "@trpc/react-query/shared";

// Create a context for event data
export const EventDataContext = createContext<{
  eventData: UseTRPCQueryResult<RouterOutput["events"]["getEvent"], unknown>;
  isNotEnded: boolean;
  isStarted: boolean;
  endUTC: number;
  startUTC: number;
  location: string | undefined | null;
  initData: string;
  eventHash: string;
  isLocationUrl: boolean;
  hasEnteredPassword: boolean;
  userEventFields: UseTRPCQueryResult<RouterOutput["userEventFields"]["getUserEventFields"], unknown>;
  userEventPasswordField:
    | {
        user_id: number;
        created_at: string | null;
        id: number | string;
        event_field_id: number | string;
        completed: boolean;
        data?: any;
      }
    | undefined;
  eventPasswordField:
    | {
        type: string | null;
        updatedAt: string | null;
        updatedBy: string;
        description: string | null;
        id: number;
        event_id: number | null;
        title: string | null;
        emoji: string | null;
        placeholder: string | null;
        order_place: number | null;
      }
    | undefined;
  accessRoles: Array<{ user_id: number; role: string }> | undefined;
  registrationFromSchema: { isCustom?: boolean } | undefined;
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
