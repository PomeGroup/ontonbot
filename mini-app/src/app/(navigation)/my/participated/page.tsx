"use client";

import Section from "@/app/_components/atoms/section";
import CustomButton from "@/app/_components/Button/CustomButton";
import EventsTimeline from "@/app/_components/Event/EventsTImeline";
import { trpc } from "@/app/_trpc/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useWebApp from "@/hooks/useWebApp";

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

  return (
    <div className="bg-brand-bg p-4 min-h-screen flex flex-col gap-4">
      <Tabs defaultValue="events">
        <TabsList>
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
            {!infiniteApi.isFetching && infiniteApi.data?.pages.at(-1)?.nextCursor && (
              <CustomButton
                onClick={() => {
                  infiniteApi.fetchNextPage();
                }}
                variant="link"
                fontSize="body"
                size="md"
              >
                Load 10 more results
              </CustomButton>
            )}
          </Section>
        </TabsContent>
        <TabsContent value="contests">Contests</TabsContent>
      </Tabs>
    </div>
  );
}
