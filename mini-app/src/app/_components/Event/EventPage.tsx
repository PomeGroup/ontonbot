"use client";

import { useWithBackButton } from "@/app/_components/atoms/buttons/web-app/useWithBackButton";
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
  useWithBackButton({
    whereTo: "/",
  });
  const { setTheme, theme } = useTheme();

  useEffect(() => {
    setTheme("light");
    return () => setTheme("dark");
  }, [setTheme, theme]);

  return (
    <Block margin="mt-2">
      <EventDataProvider eventHash={eventHash}>
        <EventDataQueryState />
      </EventDataProvider>
    </Block>
  );
};
