"use client";

import { trpc } from "@/app/_trpc/client";
import InfiniteEventList from "@/components/InfiniteEventList";
import { useParams } from "next/navigation";

export default function OrganizerEventsPage() {
  const params = useParams<{ id: string }>();
  const infiniteApi = trpc.organizers.searchOrganizerHostedEvent.useInfiniteQuery(
    { organizerId: parseInt(params.id) },
    {
      getNextPageParam(lastPage) {
        return lastPage.nextCursor;
      },
    }
  );

  return (
    <InfiniteEventList
      title="Organizer Events"
      infiniteApi={infiniteApi}
    />
  );
}
