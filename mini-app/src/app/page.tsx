"use client";
import React from "react";
import EventCard from "@/app/_components/EventCard/EventCard";
import EventCardSkeleton from "@/app/_components/EventCard/EventCardSkeleton";
import SearchBar from "@/app/_components/SearchBar/SearchBar";
import useAuth from "@/hooks/useAuth";
import { Pagination } from 'swiper/modules';
import searchEventsInputZod from "@/zodSchema/searchEventsInputZod";
import { useConfig } from "@/context/ConfigContext";
import { Block } from "konsta/react";
import { trpc } from "./_trpc/client";
// import { useTheme } from "next-themes";
import "swiper/css";
import "./page.css";

import BottomNavigation from "../components/BottomNavigation";
import EventBanner from "@/components/EventBanner";
import { OntonEvent } from "@/types";
import { Swiper, SwiperSlide } from "swiper/react";
import { SearchIcon } from "lucide-react";
import { typographyClassNameMappings } from "@/components/Typography";

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

  // const { data: upcomingEventsData, isLoading: isLoadingUpcoming } = trpc.events.getEventsWithFilters.useQuery(
  //   upcomingEventsParams,
  //   {
  //     staleTime: Infinity,
  //     enabled: true,
  //   }
  // );
  // const { data: ongoingEventsData, isLoading: isLoadingOngoing } = trpc.events.getEventsWithFilters.useQuery(
  //   { ...ongoingEventsParams, limit: 10 },
  //   {
  //     staleTime: Infinity,
  //     enabled: true,
  //   }
  // );
  // const { data: pastEventsData, isLoading: isLoadingPast } = trpc.events.getEventsWithFilters.useQuery(pastEventsParams, {
  //   staleTime: Infinity,
  //   retryDelay: 5000,
  //   enabled: true,
  // });

  // const seeAllUpcomingEventsLink = "/search/?tab=Upcoming";
  // const seeAllPastEventsLink = "/search/?tab=Past";
  const seeAllOngoingEventsLink = "/search/?tab=OnGoing";

  return (
    <Block margin="0" className="bg-[#EFEFF4] min-h-screen pb-9">
      <div className="flex flex-col pt-3">
        <div className="w-full pb-3">
          <SearchBar />
        </div>

        <div className=" flex-grow">
          <div className="flex-grow pb-4">
            {/* Slider Event */}
            <PromotedEventsSlider />
            <PromotedEventsList />
            {/* <HorizontalEvents
              title="Ongoing Events"
              link={seeAllOngoingEventsLink}
              items={ongoingEventsData?.data || []}
              isLoading={isLoadingOngoing}
            /> */}
            {/*
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
            */}
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

function PromotedEventsSlider() {
  const config = useConfig();
  const event_uuids = (Array.isArray(config?.homeSliderEventUUID) ?
    config?.homeSliderEventUUID : [config?.homeSliderEventUUID]).filter(Boolean);
  const eventCount = event_uuids.length

  // Fetch parameters
  const sliderEventParams = {
    limit: 10,
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

  if (isLoadingSlider || !sliderEventData?.data?.length) return null

  return (
    <Swiper
      // onSlideChange={handleSlideChange}
      slidesPerView='auto'
      className="-mx-3"
      spaceBetween={12}
      pagination={{ clickable: true }}
      autoHeight
      modules={[Pagination]}
      wrapperClass='swiper-wrapper pb-3 px-4'
    >
      {/* <div className='flex gap-3'> */}
      {sliderEventData?.data.map(event => (
        <SwiperSlide className='w-[220px]' key={event.event_uuid}>
          <EventBanner className="w-[220px]" event={event} key={event.event_uuid} />
        </SwiperSlide>
      ))}
    </Swiper>
  )
}

interface HorizontalEventsProps {
  title: string;
  link: string;
  items?: any[];
  isLoading: boolean;
}

// function HorizontalEvents({ title, link, items = [], isLoading }: HorizontalEventsProps) {
//   const webApp = useWebApp();
//   const userId = webApp?.initDataUnsafe?.user?.id;

//   return isLoading ? (
//     <>
//       <EventCardSkeleton />
//       <EventCardSkeleton />
//     </>
//   ) : (
//     items.length > 0 && (
//       <>
//         <div className="pt-4 w-full pb-4 flex justify-between items-center">
//           <h2 className="font-bold text-lg">{title}</h2>
//           <a
//             href={link}
//             className="text-[#007AFF] border-2 border-[#007aff] rounded-lg py-1.5 px-4 hover:underline"
//           >
//             See All
//           </a>
//         </div>
//         {items.map((event) => (
//           <EventCard
//             key={event.event_uuid}
//             event={event}
//             currentUserId={userId}
//           />
//         ))}
//       </>
//     )
//   );
// }

function PromotedEventsList() {
  // const { user: {user_id} } = useUserStore()

  // const {data, isLoading, isError} = trpc.events.getSpecialList.useQuery('homeList')

  const config = useConfig()
  const itemIds = config?.homeListEventUUID as unknown as string[]

  const { isError, isLoading, data } = trpc.events.getEventsWithFilters.useQuery({
    limit: 10,
    filter: { event_uuids: itemIds }
  }, {
    enabled: Array.isArray(itemIds) && typeof itemIds[0] === 'string'
  })

  if (isError) {
    return 'something went wrong';
  }

  if (isLoading) {
    return <>
      <EventCardSkeleton />
      <EventCardSkeleton />
    </>
  }

  if (data.data?.length === 0) {
    return null
  }

  return (
    <>
      <div className="w-full pb-2 flex justify-between items-center">
        <h2 className="font-bold text-lg">Promoted Events</h2>
        {/* <a
            href={link}
            className="text-[#007AFF] border-2 border-[#007aff] rounded-lg py-1.5 px-4 hover:underline"
          >
            See All
          </a> */}
      </div>
      {data.data?.map((event) => (
        <EventCard
          key={(event as any).event_uuid}
          event={event}
          currentUserId={0}
        />
      ))}
    </>
  );
}
