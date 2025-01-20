"use client";

import EventPageLoadingSkeleton from "../../events/[hash]/loading";
import { useEventData } from "./eventPageContext";
import { EventDataProvider } from "./EventDataProvider";
import { EventSections } from "./EventPageSections";
import { Block } from "konsta/react";

import { useEffect } from "react";
import { useTheme } from "next-themes";

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
  const { setTheme } = useTheme();

  useEffect(() => {
    setTheme("light");
  }, [setTheme]);

  return (
    <Block margin="mt-2">
      <EventDataProvider eventHash={eventHash}>
        <EventDataQueryState />
      </EventDataProvider>
    </Block>
  );
};
