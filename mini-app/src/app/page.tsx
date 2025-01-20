"use client";
import React, { useEffect, useState } from "react";
import EventCard from "@/app/_components/EventCard/EventCard";
import EventCardSkeleton from "@/app/_components/EventCard/EventCardSkeleton";
import SearchBar from "@/app/_components/SearchBar/SearchBar";
import useAuth from "@/hooks/useAuth";
import useWebApp from "@/hooks/useWebApp";
import searchEventsInputZod from "@/zodSchema/searchEventsInputZod";
import { useConfig } from "@/context/ConfigContext";
import { Swiper, SwiperSlide } from "swiper/react";
import { Block } from "konsta/react";
import { Pagination } from 'swiper/modules';
import { trpc } from "./_trpc/client";
// import { useTheme } from "next-themes";
import "swiper/css";
import "./page.css";

import BottomNavigation from "../components/BottomNavigation";
import EventBanner from "@/components/EventBanner";
import { OntonEvent } from "@/types";
import { noop } from "lodash";

// Define types for events
type EventData = any[];

const tabValueForSearchBar = 'All'
export default function Home() {
  const { authorized, role: userRole } = useAuth();
  const currentDateTime = Math.floor(Date.now() / 1000);

  // const { setTheme, theme } = useTheme();

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

  // Local state to avoid unnecessary refetches
  const [upcomingEventsState, setUpcomingEventsState] = useState<EventData>([]);
  const [ongoingEventsState, setOngoingEventsState] = useState<EventData>([]);
  const [pastEventsState, setPastEventsState] = useState<EventData>([]);

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

  const seeAllUpcomingEventsLink = "/search/?tab=Upcoming";
  const seeAllPastEventsLink = "/search/?tab=Past";
  const seeAllOngoingEventsLink = "/search/?tab=OnGoing";

  // Set local state when data is fetched
  useEffect(() => {
    if (upcomingEventsData?.data && upcomingEventsData?.data?.length > 0) setUpcomingEventsState(upcomingEventsData.data);
    if (ongoingEventsData?.data && ongoingEventsData?.data?.length > 0) setOngoingEventsState(ongoingEventsData.data);
    if (pastEventsData?.data && pastEventsData?.data?.length > 0) setPastEventsState(pastEventsData.data);
  }, [upcomingEventsData, ongoingEventsData, pastEventsData]);

  // useEffect(() => {
  //   setTheme("light");
  // }, [setTheme, theme]);

  return (
    <Block margin="0">
      <div className="flex flex-col pt-2">
        {/* Fixed Search Bar */}
        <div className="sticky top-0 z-50 w-full pb-1 bg-white">
          <SearchBar
            includeQueryParam={false}
            onUpdateResults={noop}
            tabValue={tabValueForSearchBar}
            userRole={authorized ? userRole : "user"}
          />
        </div>

        <div className=" flex-grow">
          <div className="pt-2 flex-grow pb-4">
            {/* Slider Event */}
            <PromotedEvents />
            <HorizontalEvents
              title="Ongoing Events"
              link={seeAllOngoingEventsLink}
              items={ongoingEventsState}
              isLoading={isLoadingOngoing}
            />
            <HorizontalEvents
              title="Upcoming Events"
              link={seeAllUpcomingEventsLink}
              items={upcomingEventsState}
              isLoading={isLoadingUpcoming}
            />
            <HorizontalEvents
              title="Past Events"
              link={seeAllPastEventsLink}
              items={pastEventsState}
              isLoading={isLoadingPast}
            />
          </div>
        </div>
      </div>
      <BottomNavigation active="Events" />
    </Block>
  );
}

type EventsResponseType = {
  status: 'success',
  data: (OntonEvent & { event_uuid: string })[]
}

function PromotedEvents() {
  const { config } = useConfig();
  const event_uuids = Array.isArray(config?.homeSliderEventUUID) ?
    config.homeSliderEventUUID : [config.homeSliderEventUUID];

  // Fetch parameters
  const sliderEventParams = searchEventsInputZod.parse({
    limit: 1,
    filter: {
      event_uuids,
    },
  });

  const { data: sliderEventData, isLoading: isLoadingSlider } = trpc.events
    .getEventsWithFilters.useQuery<any, EventsResponseType>(
      sliderEventParams,
      {
        staleTime: Infinity,
      }
    );

  return isLoadingSlider ? (
    <>
      <EventBanner skeleton />
      <EventBanner skeleton />
    </>
  ) : (
    (sliderEventData?.data.length || 0) > 0 && (
      <Swiper
        // onSlideChange={handleSlideChange}
        slidesPerView='auto'
        spaceBetween={16}
        pagination={{ clickable: true }}
        // autoHeight
        modules={[Pagination]}
      >
        {sliderEventData?.data.map(event => (
          <>
            <SwiperSlide className="w-[70vw]" key={event.event_uuid}>
              <EventBanner event={event} />
            </SwiperSlide>
          </>
        ))}
      </Swiper>
    )
  )
}

interface HorizontalEventsProps {
  title: string;
  link: string;
  items?: any[];
  isLoading: boolean;
}

function HorizontalEvents({ title, link, items = [], isLoading }: HorizontalEventsProps) {
  const webApp = useWebApp();
  const userId = webApp?.initDataUnsafe?.user?.id;

  return isLoading ? (
    <>
      <EventCardSkeleton />
      <EventCardSkeleton />
    </>
  ) : (
    items.length > 0 && (
      <>
        <div className="pt-4 w-full pb-4 flex justify-between items-center">
          <h2 className="font-bold text-lg">{title}</h2>
          <a
            href={link}
            className="text-[#007AFF] border-2 border-[#007aff] rounded-lg py-1.5 px-4 hover:underline"
          >
            See All
          </a>
        </div>
        {items.map((event) => (
          <EventCard
            key={event.event_uuid}
            event={event}
            currentUserId={userId}
          />
        ))}
      </>
    )
  );
}
