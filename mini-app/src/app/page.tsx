"use client";
import React, {  useEffect, useState } from "react";
import EventCard from "@/app/_components/EventCard/EventCard";
import EventCardSkeleton from "@/app/_components/EventCard/EventCardSkeleton";
import SearchBar from "@/app/_components/SearchBar/SearchBar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useAuth from "@/hooks/useAuth";
import useWebApp from "@/hooks/useWebApp";
import searchEventsInputZod from "@/zodSchema/searchEventsInputZod";
import { useRouter } from "next/navigation";
import MainButton from "./_components/atoms/buttons/web-app/MainButton";
import { trpc } from "./_trpc/client";
import "./page.css";
import zod from "zod";
import { useConfig } from "@/context/ConfigContext";
import Image from "next/image";
// Memoized MainButton to prevent unnecessary re-renders

export default function Home() {

  const { config  } = useConfig();
  const SliderEventUUID = config?.homeSliderEventUUID || "";
  console.log("SliderEventUUID", SliderEventUUID);
  const webApp = useWebApp();
  const {
    authorized,
    isLoading: useAuthLoading,
    role: userRole,
  } = useAuth();
  const UserId = webApp?.initDataUnsafe?.user?.id ;

  const router = useRouter();
  const [isMyEventsTabActive, setIsMyEventsTabActive] = useState(false);
  const createSearchQueryParams = (
    params: zod.infer<typeof searchEventsInputZod>
  ) => {
    return new URLSearchParams(
      Object.entries({
        query: params.search || "",
        startDate: params.filter?.startDate?.toString() || "",
        startDateOperator: params.filter?.startDateOperator || "",
        endDate: params.filter?.endDate?.toString() || "",
        endDateOperator: params.filter?.endDateOperator || "",
        sortBy: params.sortBy || "default",
      }).filter(([_, value]) => value !== "")
    ).toString();
  };


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
      startDate:
        Math.floor(Date.now() / 1000) - (Math.floor(Date.now() / 1000) % 600),
      startDateOperator: "<=",
    },
    sortBy: "start_date_desc",
  });

  const sliderEventParams = searchEventsInputZod.parse({
    limit: 1,
    filter: {
      event_uuids: [SliderEventUUID],
    },
  });
  const seeAllUpcomingEventsLink =
    "/search/?" + createSearchQueryParams(upcomingEventsParams);
  const seeAllPastEventsLink =
    "/search/?" + createSearchQueryParams(pastEventsParams);

  const myEventsParams = searchEventsInputZod.parse({
    limit: 0,
    offset: 0,
    filter: {
      // organizer_user_id: UserId,
      user_id: UserId,
    },
    sortBy: "start_date_desc",
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
    data: myEvents,
    isLoading: isLoadingMyEvents,
    isError: isErrorMyEvents,
    refetch: refetchMyEvents,
  } = trpc.events.getEventsWithFilters.useQuery(myEventsParams, {
    enabled: false, // Disable automatic fetching
  });

  useEffect(() => {
    if (isMyEventsTabActive) {
      refetchMyEvents().then(() =>   console.log("----use myEvents", myEvents));
    }
  }, [isMyEventsTabActive, refetchMyEvents]);


  const error = isErrorUpcoming || isErrorPast || isErrorSlider || isErrorMyEvents;
  const isLoading = isLoadingUpcoming || isLoadingPast || isLoadingSlider   ;
  if(error) {
    console.error("Error fetching data", {
      isErrorUpcoming,
      isErrorPast,
      isErrorSlider,
      isErrorMyEvents,

    });
    return  (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          An error occurred while fetching data. Please try again later.
        </div>
    )
  }
  return (
    <>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          An error occurred while fetching data. Please try again later.
        </div>
      )}
      <SearchBar
        includeQueryParam={false}
        onUpdateResults={() => {}}
      />

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
              {isLoading ? (
                <EventCardSkeleton mode={"detailed"} />
              ) : (
                <>
                  {sliderEvent?.data?.length &&
                    sliderEvent?.data?.length > 0 && (
                      <EventCard
                        event={sliderEvent?.data[0]}
                        mode={"detailed"}
                        currentUserId={UserId}
                      />
                    )}
                </>
              )}
            </>
          </div>
          <div className="pt-4  w-full pb-4  flex justify-between items-center">
            <h2 className="font-bold text-lg">Upcoming Events</h2>
            <a
              href={seeAllUpcomingEventsLink}
              className="text-zinc-300 hover:underline"
            >
              See All
            </a>
          </div>
          {isLoading
            ? [1, 2].map((index) => <EventCardSkeleton key={index} />)
            : upcomingEvents?.data?.map((event) => (
                <EventCard
                  key={event.event_uuid}
                  event={event}
                  currentUserId={UserId}
                />
              ))}
          <div className="pt-4 pb-4 flex justify-between items-center">
            <h2 className="font-bold text-lg">Past Events</h2>
            <a
              href={seeAllPastEventsLink}
              className="text-zinc-300  hover:underline"
            >
              See All
            </a>
          </div>
          {isLoading
            ? [1, 2].map((index) => <EventCardSkeleton key={index} />)
            : pastEvents?.data?.map((event) => (
                <EventCard
                  key={event.event_uuid}
                  event={event}
                  currentUserId={UserId}
                />
              ))}
        </TabsContent>

        <TabsContent value="my-events">
          <div className="pt-2">
            {isLoadingMyEvents ? (
              [1, 2].map((index) => <EventCardSkeleton key={index} />)
            ) : (myEvents?.data?.length === 0  ) ? (
              <div className="flex flex-col items-center justify-center min-h-screen text-center space-y-4">
                <div>
                  <Image
                    src={"/template-images/my-event-empty-list-msg.png"}
                    alt={"There are no Events"}
                    width={180}
                    height={180}
                  />
                </div>
                <div className="text-gray-500 max-w-md">
                  There are no Events <br/>at the time.
                </div>
              </div>
            ) : (
              myEvents?.data?.map((event) => (
                <EventCard
                  key={event.event_uuid}
                  event={event}
                  currentUserId={UserId}
                />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
      {!useAuthLoading &&
        (userRole === "admin" || userRole === "organizer") &&
        authorized && (
          <MainButton
            text="Create new event"
            onClick={() => router.push("/events/create")}
          />
        )}
    </>
  );
}
