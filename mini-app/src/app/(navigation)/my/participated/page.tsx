"use client";

import Section from "@/app/_components/atoms/section";
import CustomButton from "@/app/_components/Button/CustomButton";
import EventsTimeline from "@/app/_components/Event/EventsTImeline";
import SearchIcon from "@/app/_components/icons/search-icon";
import TournamentCard from "@/app/_components/Tournaments/TournamentCard";
import { trpc } from "@/app/_trpc/client";
import Typography from "@/components/Typography";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useWebApp from "@/hooks/useWebApp";
import { useDebouncedState } from "@mantine/hooks";
import { Skeleton } from "@mui/material";
import { useState } from "react";

export default function MyParticipatedEventsPage() {
  const webApp = useWebApp();
  const userId = webApp?.initDataUnsafe?.user?.id;
  const [inputValue, setInput] = useDebouncedState("", 500);
  const [activeTab, setActiveTab] = useState("events");

  const infiniteApi = trpc.events.getEventsWithFiltersInfinite.useInfiniteQuery(
    { filter: { user_id: userId }, search: inputValue, limit: 10 },
    {
      enabled: Boolean(userId) && Boolean(activeTab === "events"),
      getNextPageParam(lastPage) {
        return lastPage.nextCursor;
      },
    }
  );

  const contestsInfinite = trpc.tournaments.getTournaments.useInfiniteQuery(
    {
      filter: {
        status: "ended",
      },
      limit: 10,
    },
    {
      enabled: Boolean(activeTab === "contests"),
      getNextPageParam(lastPage) {
        return lastPage.nextCursor;
      },
    }
  );

  return (
    <div className="bg-brand-bg p-4 min-h-screen flex flex-col gap-4">
      <Tabs
        defaultValue="events"
        onValueChange={(v) => setActiveTab(v)}
      >
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
        <TabsContent value="contests">
          <Section>
            <Typography variant="title2">Past Contests</Typography>
            <div className="grid grid-cols-[repeat(auto-fill,_minmax(160px,_1fr))] gap-4">
              {contestsInfinite.data?.pages
                .map((p) => p.tournaments)
                .flat()
                .map((tournament) => {
                  return (
                    <TournamentCard
                      key={tournament.id}
                      tournament={tournament}
                    />
                  );
                })}
              {contestsInfinite.isFetching && (
                <>
                  <Skeleton
                    className="h-full min-h-[200px]"
                    sx={{ transform: "unset" }}
                  />
                  <Skeleton
                    className="h-full min-h-[200px]"
                    sx={{ transform: "unset" }}
                  />
                  <Skeleton
                    className="h-full min-h-[200px]"
                    sx={{ transform: "unset" }}
                  />
                </>
              )}
            </div>
            {!contestsInfinite.isFetching && contestsInfinite.data?.pages.at(-1)?.nextCursor && (
              <CustomButton
                onClick={() => {
                  contestsInfinite.fetchNextPage();
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
      </Tabs>
    </div>
  );
}
