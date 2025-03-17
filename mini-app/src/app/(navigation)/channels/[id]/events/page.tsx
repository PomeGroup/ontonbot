"use client";

import { trpc } from "@/app/_trpc/client";
import InfiniteEventList from "@/components/InfiniteEventList";

type Props = { params: { id: string } };

export default function OrganizerEventsPage({ params }: Props) {
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
