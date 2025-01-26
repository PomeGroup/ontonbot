"use client";

import React from "react";
import { Page } from "konsta/react";
import GuestList from "@/app/_components/organisms/events/GuestList";
import { useParams } from "next/navigation";
import { useGetEvent } from "@/hooks/events.hooks";

export default function GuestListPage() {
  const { hash } = useParams() as { hash?: string };
  const {data:eventData , isLoading ,isError } = useGetEvent(hash);
  if(isError) {
    return <div>something went wrong</div>
  }
  if(!eventData?.event_uuid  || isLoading) {
    return <div>Loading...</div>;
  }
  return (
    <Page>
      <GuestList
        event={eventData}
        params={{ hash: eventData.event_uuid }} // If your component needs it
      />
    </Page>
  );
}
