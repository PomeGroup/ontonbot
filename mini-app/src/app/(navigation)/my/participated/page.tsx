"use client";

import Section from "@/app/_components/atoms/section";
import CustomButton from "@/app/_components/Button/CustomButton";
import EventsTimeline from "@/app/_components/Event/EventsTImeline";
import SearchIcon from "@/app/_components/icons/search-icon";
import { trpc } from "@/app/_trpc/client";
import Typography from "@/components/Typography";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useWebApp from "@/hooks/useWebApp";
import { useDebouncedState } from "@mantine/hooks";

export default function MyParticipatedEventsPage() {
  const webApp = useWebApp();
  const userId = webApp?.initDataUnsafe?.user?.id;
  const [inputValue, setInput] = useDebouncedState("", 500);

  const infiniteApi = trpc.events.getEventsWithFiltersInfinite.useInfiniteQuery(
    { filter: { user_id: userId }, search: inputValue },
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
          <Section>
            <Input
              className="bg-brand-light mt-2"
              placeholder="Search Events and Organizers"
              prefix_icon={<SearchIcon />}
              onChange={(e) => {
                setInput(e.target.value);
              }}
            />
            <Typography variant="title2">Participated Events ({infiniteApi.data?.pages[0].items.rowsCount})</Typography>
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
