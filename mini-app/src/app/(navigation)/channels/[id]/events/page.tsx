"use client";;
import { use } from "react";

import { trpc } from "@/app/_trpc/client";
import InfiniteEventList from "@/components/InfiniteEventList";

type Props = { params: Promise<{ id: string }> };

export default function OrganizerEventsPage(props: Props) {
  const params = use(props.params);
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
