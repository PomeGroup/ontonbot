"use client";
import EventCard from "@/app/_components/EventCard/EventCard";
import EventCardSkeleton from "@/app/_components/EventCard/EventCardSkeleton";
import SearchBar from "@/app/_components/SearchBar/SearchBar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useAuth from "@/hooks/useAuth";
import useWebApp from "@/hooks/useWebApp";
import searchEventsInputZod from "@/zodSchema/searchEventsInputZod";
import { unstable_noStore as noStore } from "next/cache";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import MainButton from "./_components/atoms/buttons/web-app/MainButton";
import { trpc } from "./_trpc/client";
import "./page.css";

export default function Home({ searchParams }: { searchParams: any }) {
  noStore();
  const webApp = useWebApp();
  const { authorized, isLoading } = useAuth();
  const UserId = authorized ? webApp?.initDataUnsafe?.user?.id : 0;

  const router = useRouter();
  const [isMyEventsTabActive, setIsMyEventsTabActive] = useState(false);

  const tgWebAppStartParam = searchParams.tgWebAppStartParam;
  const upcomingEventsParams = searchEventsInputZod.parse({
    limit: 2,
    offset: 0,
    filter: {
      participationType: ["online", "in_person"],
      startDate:
        Math.floor(Date.now() / 1000) - (Math.floor(Date.now() / 1000) % 600),
    },
    sortBy: "start_date_asc",
  });

  const pastEventsParams = searchEventsInputZod.parse({
    limit: 2,
    offset: 0,
    filter: {
      participationType: ["online", "in_person"],
      endDate:
        Math.floor(Date.now() / 1000) - (Math.floor(Date.now() / 1000) % 600),
    },
    sortBy: "start_date_desc",
  });

  const sliderEventParams = searchEventsInputZod.parse({
    limit: 1,
    filter: {
      event_uuids: ["a49dfc09-3375-4a04-920e-3b997888a615"],
    },
  });

  const organizerEventsParams = searchEventsInputZod.parse({
    limit: 50,
    offset: 0,
    filter: {
      organizer_user_id: UserId,
    },
    sortBy: "start_date_asc",
  });

  const {
    data: upcomingEvents,
    isLoading: isLoadingUpcoming,
    isError: isErrorUpcoming,
  } = trpc.events.getEventsWithFilters.useQuery(upcomingEventsParams);

  const {
    data: pastEvents,
    isLoading: isLoadingPast,
    isError: isErrorPast,
  } = trpc.events.getEventsWithFilters.useQuery(pastEventsParams);

  const {
    data: sliderEvent,
    isLoading: isLoadingSlider,
    isError: isErrorSlider,
  } = trpc.events.getEventsWithFilters.useQuery(sliderEventParams);

  const {
    data: organizerEvents,
    isLoading: isLoadingOrganizer,
    isError: isErrorOrganizer,
    refetch: refetchOrganizerEvents,
  } = trpc.events.getEventsWithFilters.useQuery(organizerEventsParams, {
    enabled: false, // Disable automatic fetching
  });

  useEffect(() => {
    console.log("asdasdasdasd", upcomingEvents);
  }, [upcomingEvents]);

  const generateQueryString = (params: any) => {
    const filteredParams = {
      ...params,
      limit: undefined,
      offset: undefined,
    };

    const queryString = new URLSearchParams(
      Object.entries(filteredParams)
        .filter(([_, v]) => v !== undefined && v !== null)
        .map(([key, value]) => {
          if (typeof value === "object" && !Array.isArray(value)) {
            return [key, JSON.stringify(value)];
          } else if (Array.isArray(value)) {
            return [key, value.join(",")];
          } else {
            return [key, String(value)];
          }
        })
    ).toString();

    return queryString;
  };

  useEffect(() => {
    if (isMyEventsTabActive) {
      refetchOrganizerEvents();
    }
  }, [isMyEventsTabActive, refetchOrganizerEvents]);
  const upcomingEventsQuery = generateQueryString(upcomingEventsParams);
  const pastEventsQuery = generateQueryString(pastEventsParams);

  return (
    <>
      <SearchBar />

      <Tabs
        defaultValue="all-events"
        className="pt-2"
        onValueChange={(value) => setIsMyEventsTabActive(value === "my-events")}
      >
        <TabsList className="flex bg-gray-600 h-33 rounded-lg p-1">
          <TabsTrigger
            value="all-events"
            className="flex-1 p-2 rounded-lg text-center font-medium text-white focus:outline-none focus:ring-0 ring-offset-0 transition ease-in-out duration-150"
          >
            All events
          </TabsTrigger>
          <TabsTrigger
            value="my-events"
            className="flex-1 p-2 rounded-lg text-center font-medium text-white focus:outline-none focus:ring-0 ring-offset-0 transition ease-in-out duration-150"
          >
            My events
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all-events">
          <div className="pt-2 w-full">
            <>
              {isLoadingSlider ? (
                <EventCardSkeleton mode={"detailed"} />
              ) : (
                <>
                  {sliderEvent?.data?.length &&
                    sliderEvent?.data?.length > 0 && (
                      <EventCard
                        event={sliderEvent?.data[0]}
                        mode={"detailed"}
                      />
                    )}
                </>
              )}
            </>
          </div>
          <div className="pt-4  w-full pb-4  flex justify-between items-center">
            <h2>Upcoming Events</h2>
            <a
              href={`/search?${upcomingEventsQuery}`}
              className="text-zinc-300 hover:underline"
            >
              See All
            </a>
          </div>
          <ul>
            {isLoadingUpcoming
              ? [1, 2].map((index) => <EventCardSkeleton key={index} />)
              : upcomingEvents?.data?.map((event) => (
                  <EventCard
                    key={event.event_uuid}
                    event={event}
                  />
                ))}
          </ul>
          <div className="pt-4 pb-4 flex justify-between items-center">
            <h2>Past Events</h2>
            <a
              href={`/search?${pastEventsQuery}`}
              className="text-zinc-300  hover:underline"
            >
              See All
            </a>
          </div>
          <ul>
            {isLoadingPast
              ? [1, 2].map((index) => <EventCardSkeleton key={index} />)
              : pastEvents?.data?.map((event) => (
                  <EventCard
                    key={event.event_uuid}
                    event={event}
                  />
                ))}
          </ul>
        </TabsContent>

        <TabsContent value="my-events">
          <div className="pt-2">
            <h2>Your Events as Organizer</h2>
            <ul>
              {isLoadingOrganizer
                ? [1, 2].map((index) => <EventCardSkeleton key={index} />)
                : organizerEvents?.data?.map((event) => (
                    <EventCard
                      key={event.event_uuid}
                      event={event}
                    />
                  ))}
            </ul>
          </div>
        </TabsContent>
      </Tabs>
      {authorized && (
        <MainButton
          text="Create new event"
          onClick={() => router.push("/events/create")}
        />
      )}
    </>
  );
}
