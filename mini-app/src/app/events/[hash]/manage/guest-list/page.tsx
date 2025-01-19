"use client";

import React from "react";
import { Page, Block } from "konsta/react";
import { useManageEventContext } from "../layout";
import GuestList from "@/app/_components/organisms/events/GuestList";

export default function GuestListPage() {
  const { eventData } = useManageEventContext();
  if(eventData.event_uuid === undefined) {
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
