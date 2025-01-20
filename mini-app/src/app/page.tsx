"use client";
import React from "react";
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


const currentDateTime = Math.floor(Date.now() / 1000);

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

const tabValueForSearchBar = 'All'
export default function Home() {
  const { authorized, role: userRole } = useAuth();

  // const { setTheme, theme } = useTheme();

  const { data: upcomingEventsData, isLoading: isLoadingUpcoming } = trpc.events.getEventsWithFilters.useQuery(
    upcomingEventsParams,
    {
      staleTime: Infinity,
      enabled: true,
    }
  );
  const { data: ongoingEventsData, isLoading: isLoadingOngoing } = trpc.events.getEventsWithFilters.useQuery(
    ongoingEventsParams,
    {
      staleTime: Infinity,
      enabled: true,
    }
  );
  const { data: pastEventsData, isLoading: isLoadingPast } = trpc.events.getEventsWithFilters.useQuery(pastEventsParams, {
    staleTime: Infinity,
    retryDelay: 5000,
    enabled: true,
  });

  const seeAllUpcomingEventsLink = "/search/?tab=Upcoming";
  const seeAllPastEventsLink = "/search/?tab=Past";
  const seeAllOngoingEventsLink = "/search/?tab=OnGoing";

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
              items={ongoingEventsData?.data || []}
              isLoading={isLoadingOngoing}
            />
            <HorizontalEvents
              title="Upcoming Events"
              link={seeAllUpcomingEventsLink}
              items={upcomingEventsData?.data || []}
              isLoading={isLoadingUpcoming}
            />
            <HorizontalEvents
              title="Past Events"
              link={seeAllPastEventsLink}
              items={pastEventsData?.data || []}
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
  const event_uuids = (Array.isArray(config?.homeSliderEventUUID) ?
    config?.homeSliderEventUUID : [config?.homeSliderEventUUID]).filter(Boolean);

  const eventCount = event_uuids.length

  // Fetch parameters
  const sliderEventParams = {
    limit: 1,
    filter: {
      event_uuids: event_uuids as string[],
    },
  };

  const { data: sliderEventData, isLoading: isLoadingSlider } = trpc.events
    .getEventsWithFilters.useQuery<any, EventsResponseType>(
      sliderEventParams,
      {
        enabled: eventCount > 0,
        staleTime: Infinity,
      }
    );

  if (isLoadingSlider) return null
  return (
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
