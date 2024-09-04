"use client";
import React, {  useCallback, useEffect, useRef, useState } from "react";
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

// Define types for events
type EventData = any[];



export default function Home() {
  const { config } = useConfig();
  const SliderEventUUID = config?.homeSliderEventUUID || "";
  const webApp = useWebApp();
  const { authorized, isLoading: useAuthLoading, role: userRole } = useAuth();
  const UserId = webApp?.initDataUnsafe?.user?.id;

  const router = useRouter();
  const [activeTab, setActiveTab] = useState("all-events");
  const swiperRef = useRef<any>(null);

  // Initialize state with empty arrays to avoid undefined errors
  const [sliderEventData, setSliderEventData] = useState<EventData>([]);
  const [upcomingEventsData, setUpcomingEventsData] = useState<EventData>([]);
  const [pastEventsData, setPastEventsData] = useState<EventData>([]);
  const [myEventsData, setMyEventsData] = useState<EventData>([]);

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

  const pastEventsParams = searchEventsInputZod.parse({
    limit: 2,
    offset: 0,
    filter: {
      participationType: ["online", "in_person"],
      endDate: Math.floor(Date.now() / 1000) - (Math.floor(Date.now() / 1000) % 600),
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

  // Queries with `enabled: false` to prevent automatic fetching
  const { refetch: refetchSliderEvent } = trpc.events.getEventsWithFilters.useQuery(sliderEventParams, {
    enabled: false,
  });

  const { refetch: refetchUpcomingEvents } = trpc.events.getEventsWithFilters.useQuery(upcomingEventsParams, {
    enabled: false,
  });

  const { refetch: refetchPastEvents } = trpc.events.getEventsWithFilters.useQuery(pastEventsParams, {
    enabled: false,
  });

  const { refetch: refetchMyEvents } = trpc.events.getEventsWithFilters.useQuery(myEventsParams, {
    enabled: false,
  });

  useEffect(() => {
    // Fetch Slider Events
    refetchSliderEvent().then((res) => {
      if (res.status === "success" && Array.isArray(res.data?.data)) {
        setSliderEventData(res.data.data);
      }
    });

    // Fetch Upcoming Events
    refetchUpcomingEvents().then((res) => {
      if (res.status === "success" && Array.isArray(res.data?.data)) {
        setUpcomingEventsData(res.data.data);
      }
    });

    // Fetch Past Events
    refetchPastEvents().then((res) => {
      if (res.status === "success" && Array.isArray(res.data?.data)) {
        setPastEventsData(res.data.data);
      }
    });
  }, [refetchSliderEvent, refetchUpcomingEvents, refetchPastEvents]);

  // Handle tab click and data fetching logic
  const handleTabClick = (value: string) => {
    setActiveTab(value);
    const slideIndex = value === "all-events" ? 0 : 1;
    swiperRef.current?.slideTo(slideIndex);

    // Fetch data when switching tabs
    if (value === "my-events" && myEventsData.length === 0) {
      refetchMyEvents().then((res) => {
        if (Array.isArray(res.data?.data)) setMyEventsData(res.data.data);
      });
    }
  };

  // Handle swiper slide change
  const handleSlideChange = (swiper: any) => {
    const activeIndex = swiper.activeIndex;
    const newTab = activeIndex === 0 ? "all-events" : "my-events";
    setActiveTab(newTab);

    if (newTab === "my-events" && myEventsData.length === 0) {
      refetchMyEvents().then((res) => {
        if (Array.isArray(res.data?.data)) setMyEventsData(res.data.data);
      });
    }
  };

  // Memoized handler for the "Create Event" button
  const handleCreateEvent = useCallback(() => {
    router.push("/events/create");
  }, [router]);

  return (
      <>
        <SearchBar includeQueryParam={false} onUpdateResults={() => {}} />

        <Tabs value={activeTab} className="pt-2" onValueChange={handleTabClick}>
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
              <div className="pt-2">


                {sliderEventData.length === 0 ? (
                    <EventCardSkeleton mode={"detailed"} />
                ) : (
                    <EventCard event={sliderEventData[0]} mode={"detailed"} currentUserId={UserId} />
                )}

                <div className="pt-4 w-full pb-4 flex justify-between items-center">
                  <h2 className="font-bold text-lg">Upcoming Events</h2>
                  <a href="/search/?type=upcoming" className="text-zinc-300 hover:underline">
                    See All
                  </a>
                </div>

                {upcomingEventsData.length === 0 ? (
                    <EventCardSkeleton />
                ) : (
                    upcomingEventsData.map((event) => (
                        <EventCard key={event.event_uuid} event={event} currentUserId={UserId} />
                    ))
                )}

                <div className="pt-4 pb-4 flex justify-between items-center">
                  <h2 className="font-bold text-lg">Past Events</h2>
                  <a href="/search/?type=past" className="text-zinc-300 hover:underline">
                    See All
                  </a>
                </div>

                {pastEventsData.length === 0 ? (
                    <EventCardSkeleton />
                ) : (
                    pastEventsData.map((event) => (
                        <EventCard key={event.event_uuid} event={event} currentUserId={UserId} />
                    ))
                )}
              </div>
            </SwiperSlide>

            {/* My Events Slide */}
            <SwiperSlide>
              <div className="pt-2">
                {myEventsData.length === 0 ? (
                    [1, 2].map((index) => <EventCardSkeleton key={index} />)
                ) : myEventsData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center min-h-screen text-center space-y-4">
                      <Image src={"/template-images/my-event-empty-list-msg.png"} alt={"No Events"} width={180} height={180} />
                      <div className="text-gray-500 max-w-md">No Events at this time.</div>
                    </div>
                ) : (
                    myEventsData.map((event) => (
                        <EventCard key={event.event_uuid} event={event} currentUserId={UserId} />
                    ))
                )}
              </div>
            </SwiperSlide>
          </Swiper>
        </Tabs>

        {!useAuthLoading &&
            (userRole === "admin" || userRole === "organizer") &&
            authorized && <MemoizedMainButton text="Create new event" onClick={handleCreateEvent} />}
      </>
  );
}
