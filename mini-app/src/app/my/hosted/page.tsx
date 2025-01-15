"use client";

import { trpc } from "@/app/_trpc/client";
import InfiniteEventList from "@/components/InfiniteEventList";
import useAuth from "@/hooks/useAuth";
import useWebApp from '@/hooks/useWebApp';

export default function MyParticipatedEventsPage() {
	const webApp = useWebApp()
	  const userId = webApp?.initDataUnsafe?.user?.id;

  const infiniteApi = trpc.events.getEventsWithFiltersInfinite.useInfiniteQuery(
    { filter: { organizer_user_id: userId } },
    {
      enabled: Boolean(userId),
      getNextPageParam(lastPage) {
        return lastPage.nextCursor;
      },
    }
  );

  return (
    <InfiniteEventList
      title="My Hosted Events"
      infiniteApi={infiniteApi}
    />
  );
}
