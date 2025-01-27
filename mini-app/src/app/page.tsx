"use client";
import React from "react";
import EventCard from "@/app/_components/EventCard/EventCard";
import EventCardSkeleton from "@/app/_components/EventCard/EventCardSkeleton";
import SearchBar from "@/app/_components/SearchBar/SearchBar";
import { Pagination } from 'swiper/modules';
// import searchEventsInputZod from "@/zodSchema/searchEventsInputZod";
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
import { ChevronRightIcon } from "lucide-react";
import Typography from "@/components/Typography";

// const currentDateTime = Math.floor(Date.now() / 1000);

// const upcomingEventsParams = searchEventsInputZod.parse({
//   limit: 2,
//   offset: 0,
//   filter: {
//     participationType: ["online", "in_person"],
//     startDate: currentDateTime,
//   },
//   sortBy: "start_date_asc",
// });

export default function Home() {
  return (
    <Block margin="0" className="bg-[#EFEFF4] pb-16 min-h-screen">
      <div className="flex flex-col pt-3">
        <div className="w-full pb-3">
          <SearchBar />
        </div>

        <div className=" flex-grow">
          <div className="flex-grow pb-4">
            {/* Slider Event */}
            <PromotedEventsSlider />
            <PromotedEventsList />
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

  const {
    data: sliderEventData,
    isLoading: isLoadingSlider
  } = trpc.events
    .getEventsWithFilters.useQuery<any, EventsResponseType>(
      sliderEventParams,
      {
        enabled: eventCount > 0,
        staleTime: Infinity,
      }
    );

  if (!isLoadingSlider && !sliderEventData?.data?.length) return null

  let content = <div className="flex gap-3 overflow-x-hidden -mx-3 px-3 pb-3">
    <EventBanner skeleton className='flex-[0_0_220px] h-[220px]' />
    <EventBanner skeleton className='flex-[0_0_220px] h-[220px]' />
    <EventBanner skeleton className='flex-[0_0_220px] h-[220px]' />
  </div>

  if (!isLoadingSlider) {
    content = (
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

  return (
    <>
      <h2 className="font-bold text-lg mb-2">Featured Events</h2>
      {content}
    </>
  )
}

function PromotedEventsList() {
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

  if (!isLoading && data.data?.length === 0) {
    return null
  }

  let content = <>
    <EventCardSkeleton />
    <EventCardSkeleton />
  </>
  if (data?.data?.length) {
    content = <>{data.data?.map((event) => (
      <EventCard
        key={(event as any).event_uuid}
        event={event}
        currentUserId={0}
      />
    ))}
    </>
  }

  return (
    <>
      <div className="w-full pb-2 flex justify-between items-center">
        <h2 className="font-bold text-lg">Events</h2>
        <a
          href='/search/'
          className={`text-[#007AFF] font-medium flex align-center`}
        >
          <span>See All</span>
          <ChevronRightIcon width={20} className='ml-1 -my-0.5' />
        </a>
      </div>
      {content}
    </>
  );
}

// interface HorizontalEventsProps {
//   title: string;
//   link: string;
//   items?: any[];
//   isLoading: boolean;
// }

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
