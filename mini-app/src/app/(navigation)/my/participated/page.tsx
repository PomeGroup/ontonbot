"use client";

import Section from "@/app/_components/atoms/section";
import EventsTimeline from "@/app/_components/Event/EventsTImeline";
import { trpc } from "@/app/_trpc/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useWebApp from "@/hooks/useWebApp";
import { useEffect, useRef } from "react";

export default function MyParticipatedEventsPage() {
  const webApp = useWebApp();
  const userId = webApp?.initDataUnsafe?.user?.id;

  const infiniteApi = trpc.events.getEventsWithFiltersInfinite.useInfiniteQuery(
    { filter: { user_id: userId } },
    {
      enabled: Boolean(userId),
      getNextPageParam(lastPage) {
        return lastPage.nextCursor;
      },
    }
  );

  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loader = loaderRef.current;
    if (!loader) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && infiniteApi.hasNextPage && !infiniteApi.isFetchingNextPage) {
        infiniteApi.fetchNextPage();
      }
    });
    observer.observe(loader);
    return () => {
      observer.unobserve(loader);
    };
  }, [infiniteApi]);

  return (
    <div className="bg-brand-bg">
      <Tabs defaultValue="events">
        <TabsList className="">
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="contests">Contests</TabsTrigger>
        </TabsList>
        <TabsContent value="events">
          <Section title={`Participated Events (${infiniteApi.data?.pages[0].items.rowsCount})`}>
            <EventsTimeline
              isLoading={infiniteApi.isFetching}
              preserveDataOnFetching
              events={infiniteApi.data?.pages.map((p) => p.items.eventsData).flat() || null}
            />
          </Section>
        </TabsContent>
        <TabsContent value="contests">Contests</TabsContent>
      </Tabs>
    </div>
  );
}
