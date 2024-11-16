"use client";

import { useWithBackButton } from "@/app/_components/atoms/buttons/web-app/useWithBackButton";
import EventPageLoadingSkeleton from "../../events/[hash]/loading";
import { useEventData } from "./eventPageContext";
import { EventDataProvider } from "./EventDataProvider";
import { EventSections } from "./EventPageSections";

const EventDataQueryState = () => {
  const { eventData, initData } = useEventData();

  switch (true) {
    case eventData.isLoading || !initData:
      return <EventPageLoadingSkeleton />;
    case eventData.isError || !eventData.isSuccess:
      return <div>Something went wrong...</div>;
    case eventData.data === null:
      return <div>Event Not Found</div>;
    default:
      return <EventSections />;
  }
};

export const EventDataPage = ({ eventHash }: { eventHash: string }) => {
  useWithBackButton({
    whereTo: "/",
  });

  return (
    <EventDataProvider eventHash={eventHash}>
      <EventDataQueryState />
    </EventDataProvider>
  );
};
