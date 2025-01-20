"use client";

import React from "react";
import { Page } from "konsta/react";
import { useManageEventContext } from "../../../../../context/ManageEventContext";
import GuestList from "@/app/_components/organisms/events/GuestList";

export default function GuestListPage() {
  const { eventData } = useManageEventContext();
  if(!eventData?.event_uuid) {
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
