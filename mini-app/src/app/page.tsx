"use client";
import React, { useEffect, useRef, useState } from "react";
import EventCard from "@/app/_components/EventCard/EventCard";
import EventCardSkeleton from "@/app/_components/EventCard/EventCardSkeleton";
import SearchBar from "@/app/_components/SearchBar/SearchBar";
import useAuth from "@/hooks/useAuth";
import useWebApp from "@/hooks/useWebApp";
import searchEventsInputZod from "@/zodSchema/searchEventsInputZod";
import { trpc } from "./_trpc/client";
import "./page.css";
import { useConfig } from "@/context/ConfigContext";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import applyTabFilter from "@/app/_components/SearchBar/applyTabFilter";
import { Block } from "konsta/react";
import { useTheme } from "next-themes";

import BottomNavigation from "./_components/BottomNavigation";


// Define types for events
type EventData = any[];

export default function Home() {
  const { config } = useConfig();
  const SliderEventUUID = Array.isArray(config?.homeSliderEventUUID)
    ? config.homeSliderEventUUID[0]
    : "";
  const webApp = useWebApp();
  const { authorized, role: userRole } = useAuth();
  const currentDateTime = Math.floor(Date.now() / 1000);

  const UserId = webApp?.initDataUnsafe?.user?.id;

  const [activeTab, setActiveTab] = useState("all-events");
  const [tabValueForSearchBar, setTabValueForSearchBar] = useState("All");
  const swiperRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null); // Ref for scrollable area
  const { setTheme, theme } = useTheme();

  // Store the last scroll positions of each tab
  const scrollPositions = useRef<{ [key: string]: number }>({
    "all-events": 0,
    "my-events": 0,
  });

  // Fetch parameters
  const sliderEventParams = searchEventsInputZod.parse({
    limit: 1,
    filter: {
      event_uuids: [SliderEventUUID],
    },
  });

  const upcomingEventsParams = searchEventsInputZod.parse({
    limit: 2,
    offset: 0,
    filter: {
      participationType: ["online", "in_person"],
      startDate: currentDateTime,
    },
    sortBy: "start_date_asc",
  });

  const ongoingEventsParams = searchEventsInputZod.parse({
    limit: 2,
    offset: 0,
    filter: {
      participationType: ["online", "in_person"],
      startDate: currentDateTime,
      startDateOperator: "<=",
      endDate: currentDateTime,
      endDateOperator: ">=",
    },
    sortBy: "random",
  });

  const pastEventsParams = searchEventsInputZod.parse({
    limit: 2,
    offset: 0,
    filter: {
      participationType: ["online", "in_person"],
      endDate: currentDateTime - (currentDateTime % 600),
    },
    sortBy: "start_date_desc",
  });

  const myEventsParams = searchEventsInputZod.parse({
    limit: 0,
    offset: 0,
    filter: {
      user_id: UserId,
    },
    sortBy: "start_date_desc",
  });

  // Local state to avoid unnecessary refetches
  const [sliderEventsState, setSliderEventsState] = useState<EventData>([]);
  const [upcomingEventsState, setUpcomingEventsState] = useState<EventData>([]);
  const [ongoingEventsState, setOngoingEventsState] = useState<EventData>([]);
  const [pastEventsState, setPastEventsState] = useState<EventData>([]);

  // Queries without caching
  const { data: sliderEventData, isLoading: isLoadingSlider } = trpc.events.getEventsWithFilters.useQuery(
    sliderEventParams,
    {
      staleTime: Infinity,
      enabled: sliderEventsState.length === 0,
    }
  );
  const { data: upcomingEventsData, isLoading: isLoadingUpcoming } = trpc.events.getEventsWithFilters.useQuery(
    upcomingEventsParams,
    {
      staleTime: Infinity,
      enabled: upcomingEventsState.length === 0,
    }
  );
  const { data: ongoingEventsData, isLoading: isLoadingOngoing } = trpc.events.getEventsWithFilters.useQuery(
    ongoingEventsParams,
    {
      staleTime: Infinity,
      enabled: ongoingEventsState.length === 0,
    }
  );
  const { data: pastEventsData, isLoading: isLoadingPast } = trpc.events.getEventsWithFilters.useQuery(pastEventsParams, {
    staleTime: Infinity,
    retryDelay: 5000,
    enabled: pastEventsState.length === 0,
  });
  const {
    data: myEventsData,
    isLoading: isLoadingMyEvents,
    refetch: refetchMyEvents,
  } = trpc.events.getEventsWithFilters.useQuery(myEventsParams, {
    staleTime: Infinity,
    enabled: false, // Disable auto-fetch for "My Events"
  });

  const seeAllUpcomingEventsLink = "/search/?tab=Upcoming";
  const seeAllPastEventsLink = "/search/?tab=Past";
  const seeAllOngoingEventsLink = "/search/?tab=OnGoing";

  // Set local state when data is fetched
  useEffect(() => {
    if (sliderEventData?.data && sliderEventData?.data?.length > 0) setSliderEventsState(sliderEventData.data);
    if (upcomingEventsData?.data && upcomingEventsData?.data?.length > 0) setUpcomingEventsState(upcomingEventsData.data);
    if (ongoingEventsData?.data && ongoingEventsData?.data?.length > 0) setOngoingEventsState(ongoingEventsData.data);
    if (pastEventsData?.data && pastEventsData?.data?.length > 0) setPastEventsState(pastEventsData.data);
  }, [sliderEventData, upcomingEventsData, ongoingEventsData, pastEventsData]);

  // Disable body scroll with inline styles
  // useEffect(() => {
  //   document.body.style.overflow = "hidden";
  //   document.body.style.height = "100vh";
  //   return () => {
  //     document.body.style.overflow = "";
  //     document.body.style.height = "";
  //   };
  // }, []);

  // Restore scroll position or scroll to top when tab changes
  useEffect(() => {
    const lastScrollPosition = scrollPositions.current[activeTab] || 0;
    setTabValueForSearchBar(activeTab === "all-events" ? "All" : "My Events");
    applyTabFilter(activeTab === "all-events" ? "All" : "MyEvents", UserId);
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: lastScrollPosition,
        behavior: "smooth",
      });
    }
  }, [activeTab]);

  // Handle swiper slide change
  const handleSlideChange = (swiper: any) => {
    const activeIndex = swiper.activeIndex;
    const newTab = activeIndex === 0 ? "all-events" : "my-events";
    // Save the current scroll position before switching slides
    if (scrollRef.current) {
      scrollPositions.current[activeTab] = scrollRef.current.scrollTop;
    }

    setActiveTab(newTab);

    if (newTab === "my-events") {
      refetchMyEvents();
    }
  };

  useEffect(() => {
    setTheme("light");
  }, [theme]);

  return (
    <Block margin="0">
      <div className="flex flex-col pt-2">
        {/* Fixed Search Bar */}
        <div className="sticky top-0 z-50 w-full pb-1 bg-white">
          <SearchBar
            includeQueryParam={false}
            onUpdateResults={() => {}}
            tabValue={tabValueForSearchBar}
            userRole={authorized ? userRole : "user"}
          />

          {/* Tabs Header */}
          {/* <Segmented
            strong
            rounded
          >
            <SegmentedButton
              rounded
              strong
              active={activeTab === "all-events"}
              onClick={() => handleTabClick("all-events")}
            >
              All events
            </SegmentedButton>
            <SegmentedButton
              rounded
              strong
              active={activeTab === "my-events"}
              onClick={() => handleTabClick("my-events")}
            >
              My events
            </SegmentedButton>
          </Segmented> */}
        </div>

        {/* Scrollable Content */}
        <div className=" flex-grow">
          <Swiper
            onSlideChange={handleSlideChange}
            slidesPerView={1}
            spaceBetween={30}
            pagination={{ clickable: true }}
            autoHeight
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
            }}
          >
            {/* All Events Slide */}
            <SwiperSlide>
              <div className="pt-2 flex-grow pb-4">
                {/* Slider Event */}
                {isLoadingSlider && sliderEventsState.length === 0 ? (
                  <>
                    <EventCardSkeleton mode={"detailed"} />
                    <EventCardSkeleton mode={"detailed"} />
                  </>
                ) : (
                  sliderEventsState.length > 0 && (
                    <div className="mb-4">
                      <EventCard
                        event={sliderEventsState[0]}
                        mode={"detailed"}
                        currentUserId={UserId}
                      />
                    </div>
                  )
                )}

                {/* Ongoing Events */}
                {isLoadingOngoing && ongoingEventsState.length === 0 ? (
                  <>
                    <EventCardSkeleton />
                    <EventCardSkeleton />
                  </>
                ) : (
                  ongoingEventsState.length > 0 && (
                    <>
                      <div className="pt-4 w-full pb-4 flex justify-between items-center">
                        <h2 className="font-bold text-lg">Ongoing Events</h2>
                        <a
                          href={seeAllOngoingEventsLink}
                          className="text-zinc-300 hover:underline"
                        >
                          See All
                        </a>
                      </div>
                      {ongoingEventsState.map((event) => (
                        <EventCard
                          key={event.event_uuid}
                          event={event}
                          currentUserId={UserId}
                          mode={"ongoing"}
                        />
                      ))}
                    </>
                  )
                )}

                {/* Upcoming Events */}
                {isLoadingUpcoming && upcomingEventsState.length === 0 ? (
                  <>
                    <EventCardSkeleton />
                    <EventCardSkeleton />
                  </>
                ) : (
                  upcomingEventsState.length > 0 && (
                    <>
                      <div className="pt-4 w-full pb-4 flex justify-between items-center">
                        <h2 className="font-bold text-lg">Upcoming Events</h2>
                        <a
                          href={seeAllUpcomingEventsLink}
                          className="text-zinc-300 hover:underline"
                        >
                          See All
                        </a>
                      </div>
                      {upcomingEventsState.map((event) => (
                        <EventCard
                          key={event.event_uuid}
                          event={event}
                          currentUserId={UserId}
                        />
                      ))}
                    </>
                  )
                )}

                {/* Past Events */}
                {isLoadingPast && pastEventsState.length === 0 ? (
                  <>
                    <EventCardSkeleton />
                    <EventCardSkeleton />
                  </>
                ) : (
                  pastEventsState.length > 0 && (
                    <>
                      <div className="pt-4 pb-4 flex justify-between items-center">
                        <h2 className="font-bold text-lg">Past Events</h2>
                        <a
                          href={seeAllPastEventsLink}
                          className="text-zinc-300 hover:underline"
                        >
                          See All
                        </a>
                      </div>
                      {pastEventsState.map((event) => (
                        <EventCard
                          key={event.event_uuid}
                          event={event}
                          currentUserId={UserId}
                        />
                      ))}
                    </>
                  )
                )}
              </div>
            </SwiperSlide>

            {/* My Events Slide */}
            <SwiperSlide>
              <div className="pt-2 flex-grow overflow-y-auto pb-4 min-h-[calc(100vh-10rem)]">
                {isLoadingMyEvents ? (
                  [1, 2, 3, 4, 5].map((index) => <EventCardSkeleton key={index} />)
                ) : myEventsData?.data?.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center flex-grow h-[calc(100vh-10rem)] gap-4">
                    <Image
                      src={"/template-images/my-event-empty-list-msg.png"}
                      alt={"No Events"}
                      width={180}
                      height={180}
                    />
                    <div className="text-gray-500 max-w-md">No Events at this time.</div>
                  </div>
                ) : (
                  myEventsData?.data?.map((event) => (
                    <>
                      <EventCard
                        key={event.event_uuid}
                        event={event}
                        currentUserId={UserId}
                        mode={currentDateTime > event.startDate && currentDateTime < event.endDate ? "ongoing" : "normal"}
                      />
                    </>
                  ))
                )}
              </div>
            </SwiperSlide>
          </Swiper>
        </div>
      </div>
      <BottomNavigation active="Events" />
    </Block>
  );
}
