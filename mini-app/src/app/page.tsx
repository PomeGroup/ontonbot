"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import EventCard from "@/app/_components/EventCard/EventCard";
import EventCardSkeleton from "@/app/_components/EventCard/EventCardSkeleton";
import SearchBar from "@/app/_components/SearchBar/SearchBar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useAuth from "@/hooks/useAuth";
import useWebApp from "@/hooks/useWebApp";
import searchEventsInputZod from "@/zodSchema/searchEventsInputZod";
import { useRouter } from "next/navigation";
import { trpc } from "./_trpc/client";
import "./page.css";
import { useConfig } from "@/context/ConfigContext";
import Image from "next/image";
import MemoizedMainButton from "@/app/_components/Memoized/MemoizedMainButton";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import applyTabFilter from "@/app/_components/SearchBar/applyTabFilter";
import * as Sentry from '@sentry/nextjs';
// Define types for events
type EventData = any[];

export default function Home() {
  const { config } = useConfig();
  const SliderEventUUID = config?.homeSliderEventUUID || "";
  const webApp = useWebApp();
  const { authorized, isLoading: useAuthLoading, role: userRole } = useAuth();

  Sentry.setUser({
    id: "user-id",        // Replace with the user's ID
    username: "radio", // Replace with the username
    email: "user@example.com" // Optional: add email
  });

  const UserId = webApp?.initDataUnsafe?.user?.id;

  const router = useRouter();
  const [activeTab, setActiveTab] = useState("all-events");
  const [tabValueForSearchBar, setTabValueForSearchBar] = useState("All");
  const swiperRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null); // Ref for scrollable area

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
      startDate: Math.floor(Date.now() / 1000),
    },
    sortBy: "start_date_asc",
  });

  const ongoingEventsParams = searchEventsInputZod.parse({
    limit: 2,
    offset: 0,
    filter: {
      participationType: ["online", "in_person"],
      startDate: Math.floor(Date.now() / 1000),
      startDateOperator: "<=",
      endDate: Math.floor(Date.now() / 1000),
      endDateOperator: ">=",
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
  const { data: sliderEventData, isLoading: isLoadingSlider } =
    trpc.events.getEventsWithFilters.useQuery(sliderEventParams, {
      cacheTime: 10000,
      enabled: sliderEventsState.length === 0,
    });
  const { data: upcomingEventsData, isLoading: isLoadingUpcoming } =
    trpc.events.getEventsWithFilters.useQuery(upcomingEventsParams, {
      cacheTime: 10000,
      enabled: upcomingEventsState.length === 0,
    });
  const { data: ongoingEventsData, isLoading: isLoadingOngoing } =
    trpc.events.getEventsWithFilters.useQuery(ongoingEventsParams, {
      cacheTime: 10000,
      enabled: ongoingEventsState.length === 0,
    });
  const { data: pastEventsData, isLoading: isLoadingPast } =
    trpc.events.getEventsWithFilters.useQuery(pastEventsParams, {
      cacheTime: 10000,
      retryDelay: 5000,
      enabled: pastEventsState.length === 0,
    });
  const {
    data: myEventsData,
    isLoading: isLoadingMyEvents,
    refetch: refetchMyEvents,
  } = trpc.events.getEventsWithFilters.useQuery(myEventsParams, {
    cacheTime: 10000,
    enabled: false, // Disable auto-fetch for "My Events"
  });

  const seeAllUpcomingEventsLink = "/search/?tab=Upcoming";
  const seeAllPastEventsLink = "/search/?tab=Past";
  const seeAllOngoingEventsLink = "/search/?tab=OnGoing";

  // Set local state when data is fetched
  useEffect(() => {
    if (sliderEventData?.data && sliderEventData?.data?.length > 0)
      setSliderEventsState(sliderEventData.data);
    if (upcomingEventsData?.data && upcomingEventsData?.data?.length > 0)
      setUpcomingEventsState(upcomingEventsData.data);
    if (ongoingEventsData?.data && ongoingEventsData?.data?.length > 0)
      setOngoingEventsState(ongoingEventsData.data);
    if (pastEventsData?.data && pastEventsData?.data?.length > 0)
      setPastEventsState(pastEventsData.data);
  }, [sliderEventData, upcomingEventsData, ongoingEventsData, pastEventsData]);

  // Disable body scroll with inline styles
  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.body.style.height = "100vh";
    return () => {
      document.body.style.overflow = "";
      document.body.style.height = "";
    };
  }, []);

  // Restore scroll position or scroll to top when tab changes
  useEffect(() => {
    const lastScrollPosition = scrollPositions.current[activeTab] || 0;
    setTabValueForSearchBar(activeTab === "all-events" ? "All" : "MyEvents");
    applyTabFilter(activeTab === "all-events" ? "All" : "MyEvents", UserId);
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: lastScrollPosition,
        behavior: "smooth",
      });
    }
  }, [activeTab]);

  // Handle tab click and data fetching logic
  const handleTabClick = (value: string) => {
    // Save the current scroll position before switching tabs
    if (scrollRef.current) {
      scrollPositions.current[activeTab] = scrollRef.current.scrollTop;
    }

    setActiveTab(value);
    const slideIndex = value === "all-events" ? 0 : 1;
    swiperRef.current?.slideTo(slideIndex);

    // Fetch data when switching tabs
    if (value === "my-events") {
      refetchMyEvents();
    }
  };

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
  // Memoized handler for the "Create Event" button
  const handleCreateEvent = useCallback(() => {
    router.push("/events/create");
  }, [router]);

  return (
    <>
      <div className="flex flex-col h-screen">
        {/* Fixed Search Bar */}
        <div className="sticky top-0 z-50 w-full bg-[#1C1C1E] pb-1">
          <SearchBar
            includeQueryParam={false}
            onUpdateResults={() => {}}
            tabValue={tabValueForSearchBar}
            userRole={authorized ? userRole : "user"}
          />

          {/* Tabs Header */}
          <Tabs
            value={activeTab}
            className="pt-2 flex-shrink-0"
            onValueChange={handleTabClick}
          >
            <TabsList className="flex bg-gray-600 h-33 rounded-lg p-1">
              <TabsTrigger
                value="all-events"
                className={`flex-1 p-2 rounded-lg text-center font-medium text-white focus:outline-none ${
                  activeTab === "all-events" ? "bg-blue-600" : "bg-transparent"
                }`}
              >
                All events
              </TabsTrigger>
              <TabsTrigger
                value="my-events"
                className={`flex-1 p-2 rounded-lg text-center font-medium text-white focus:outline-none ${
                  activeTab === "my-events" ? "bg-blue-600" : "bg-transparent"
                }`}
              >
                My events
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Scrollable Content */}
        <div

          className=" flex-grow"
        >
          <Swiper
            onSlideChange={handleSlideChange}
            slidesPerView={1}
            spaceBetween={30}
            pagination={{ clickable: true }}
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
            }}
          >
            {/* All Events Slide */}
            <SwiperSlide>
              <div className="pt-2 flex-grow overflow-y-auto h-screen pb-[120px]">
                {/* Slider Event */}
                {isLoadingSlider && sliderEventsState.length === 0 ? (
                  <>
                    <EventCardSkeleton mode={"detailed"} />
                    <EventCardSkeleton mode={"detailed"} />
                  </>
                ) : (
                  sliderEventsState.length > 0 && (
                    <EventCard
                      event={sliderEventsState[0]}
                      mode={"detailed"}
                      currentUserId={UserId}
                    />
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
              <div className="pt-2 flex-grow overflow-y-auto h-screen pb-[120px]">
                {isLoadingMyEvents ? (
                  [1, 2, 3, 4, 5].map((index) => (
                    <EventCardSkeleton key={index} />
                  ))
                ) : myEventsData?.data?.length === 0 ? (
                  <div className="flex flex-col items-center justify-center min-h-screen text-center space-y-4">
                    <Image
                      src={"/template-images/my-event-empty-list-msg.png"}
                      alt={"No Events"}
                      width={180}
                      height={180}
                    />
                    <div className="text-gray-500 max-w-md">
                      No Events at this time.
                    </div>
                  </div>
                ) : (
                  myEventsData?.data?.map((event) => (
                    <>
                      <EventCard
                          key={event.event_uuid}
                          event={event}
                          currentUserId={UserId}
                      />

                    </>
                  ))
                )}
              </div>
            </SwiperSlide>
          </Swiper>
        </div>
      </div>

      {!useAuthLoading &&
        (userRole === "admin" || userRole === "organizer") &&
        authorized && (
          <MemoizedMainButton
            text="Create new event"
            onClick={handleCreateEvent}
          />
        )}
    </>
  );
}
