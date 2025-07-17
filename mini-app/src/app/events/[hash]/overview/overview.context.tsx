import { ErrorState } from "@/app/_components/ErrorState";
import DataStatus from "@/app/_components/molecules/alerts/DataStatus";
import { useGetEvent } from "@/hooks/events.hooks";
import { AppRouter } from "@/server";
import { inferRouterOutputs } from "@trpc/server";
import { useParams } from "next/navigation";
import React, { createContext } from "react";

type EventData = inferRouterOutputs<AppRouter>["events"]["getEvent"];

interface EventOverviewContextType {
  eventData: EventData | null;
  isLoading: boolean;
  isError: boolean;
}

const EventOverviewContext = createContext<EventOverviewContextType>({
  eventData: null,
  isLoading: false,
  isError: false,
});

export const EventOverviewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { hash } = useParams<{ hash: string }>();
  const { data: eventData, isLoading, isError } = useGetEvent(hash);

  if (isError) {
    return <ErrorState errorCode="event_not_found" />;
  }

  if (isLoading || !eventData) {
    return (
      <DataStatus
        title="Fetching Overview..."
        status="pending"
      />
    );
  }

  return <EventOverviewContext.Provider value={{ eventData, isLoading, isError }}>{children}</EventOverviewContext.Provider>;
};

export const useEventOverview = () => {
  const context = React.useContext(EventOverviewContext);

  if (!context) {
    throw new Error("useEventOverview must be used within EventOverviewProvider");
  }

  return context;
};
