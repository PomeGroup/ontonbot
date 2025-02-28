"use client";

import EventPageLoadingSkeleton from "../../events/[hash]/loading";
import { useEventData } from "./eventPageContext";
import { EventDataProvider } from "./EventDataProvider";
import { EventSections } from "./EventPageSections";
import { Page } from "konsta/react";

import { useEffect } from "react";
import { useTheme } from "next-themes";

const EventDataQueryState = () => {
  const { eventData, initData } = useEventData();

  switch (true) {
    case eventData.isLoading || !initData:
      return <EventPageLoadingSkeleton />;
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
    <Page>
      <EventDataProvider eventHash={eventHash}>
        <EventDataQueryState />
      </EventDataProvider>
    </Page>
  );
};
