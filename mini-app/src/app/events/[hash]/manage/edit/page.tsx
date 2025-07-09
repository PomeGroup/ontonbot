"use client";

import ManageEvent from "@/app/_components/organisms/events/manageEvent/ManageEvent";
import { useGetEvent } from "@/hooks/events.hooks";
import { useParams } from "next/navigation";

export default function CreateEventAdminPage() {
  const params = useParams<{ hash: string }>();
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
