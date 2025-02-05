"use client";

import React from "react";
import { Page } from "konsta/react";

import { useGetEvent } from "@/hooks/events.hooks";
import ManageEvent from "@/app/_components/organisms/events/ManageEvent";

interface CreateEventAdminPageProps {
  params: { hash: string };
}

export default function CreateEventAdminPage({ params }: CreateEventAdminPageProps) {
  const event = useGetEvent(params.hash);

  if (event.error) {
    return <div>Error: {event.error.message}</div>;
  }
  if (!event.data) {
    return <div>Loading event data...</div>;
  }

  const eventData = event.data;

  return (
    <Page>
      <ManageEvent event={eventData} />
    </Page>
  );
}
