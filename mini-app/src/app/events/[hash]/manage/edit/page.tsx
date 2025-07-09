"use client";;
import { use } from "react";

import ManageEvent from "@/app/_components/organisms/events/manageEvent/ManageEvent";
import { useGetEvent } from "@/hooks/events.hooks";

interface CreateEventAdminPageProps {
  params: Promise<{ hash: string }>;
}

export default function CreateEventAdminPage(props: CreateEventAdminPageProps) {
  const params = use(props.params);
  const event = useGetEvent(params.hash);

  if (event.error) {
    return <div>Error: {event.error.message}</div>;
  }
  if (!event.data) {
    return <div>Loading event data...</div>;
  }

  const eventData = event.data;

  return (
    <div>
      <ManageEvent event={eventData} />
    </div>
  );
}
