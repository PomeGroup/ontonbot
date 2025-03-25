"use client";
import EventCard from "@/app/_components/EventCard/EventCard";
import SearchBar from "@/app/_components/SearchBar/SearchBar";
import "@/app/page.css";
import EventBanner from "@/components/EventBanner";
import Typography from "@/components/Typography";
import { useConfig } from "@/context/ConfigContext";
import { OntonEvent } from "@/types";
import { Skeleton } from "@mui/material";
import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import TournamentCard from "../_components/Tournaments/TournamentCard";
import CustomCard from "../_components/atoms/cards/CustomCard";
import DataStatus from "../_components/molecules/alerts/DataStatus";
import { trpc } from "../_trpc/client";

import { useMemo } from "react";
import "swiper/css";
import "swiper/css/pagination";

export default function Home() {
  return (
    <>
      <div className="flex flex-col pt-3">
        <div className="w-full pb-3">
          <SearchBar />
        </div>

        <div className=" flex-grow">
          <div className="flex-grow pb-4">
            {/* Slider Event */}
            <PromotedEventsSlider />
            <FeaturedContests />
            <OngoingEvents />
            <UpcomingEvents />
          </div>
        </div>
      </div>
    </>
  );
}

type EventsResponseType = {
  status: "success";
  data: (OntonEvent & { event_uuid: string })[];
};

function PromotedEventsSlider() {
  const config = useConfig();
  const event_uuids = (
    Array.isArray(config?.homeSliderEventUUID) ? config?.homeSliderEventUUID : [config?.homeSliderEventUUID]
  ).filter(Boolean);
  const eventCount = event_uuids.length;

  // Fetch parameters
  const sliderEventParams = {
    limit: 10,
    filter: {
      event_uuids: event_uuids as string[],
    },
    sortBy: "do_not_order" as const,
  };

  const { data: sliderEventData, isLoading: isLoadingSlider } = trpc.events.getEventsWithFilters.useQuery<
    any,
    EventsResponseType
  >(sliderEventParams, {
    enabled: eventCount > 0,
    staleTime: Infinity,
  });

  if (!isLoadingSlider && !sliderEventData?.data?.length) return null;

  let content = (
    <div className="flex gap-3 overflow-x-hidden -mx-3 px-3 pb-3">
      <EventBanner
        skeleton
        className="flex-[0_0_220px] h-[220px]"
      />
      <EventBanner
        skeleton
        className="flex-[0_0_220px] h-[220px]"
      />
      <EventBanner
        skeleton
        className="flex-[0_0_220px] h-[220px]"
      />
    </div>
  );

  if (!isLoadingSlider) {
    content = (
      <Swiper
        slidesPerView="auto"
        className="!-mx-4 !pe-8"
        spaceBetween={12}
        pagination
        autoHeight
        modules={[Pagination]}
        wrapperClass="swiper-wrapper pb-8 px-4"
      >
        {/* <div className='flex gap-3'> */}
        {sliderEventData?.data.map((event) => (
          <SwiperSlide
            className="!w-[220px] !h-[220px]"
            key={event.event_uuid}
          >
            <EventBanner
              event={event}
              key={event.event_uuid}
            />
          </SwiperSlide>
        ))}
      </Swiper>
    );
  }

  return (
    <>
      <h2 className="font-bold text-lg mb-2">Featured Events</h2>
      {content}
    </>
  );
}

const FeaturedContests = () => {
  const tournomants = trpc.tournaments.getTournaments.useQuery({
    limit: 5,
    filter: {
      status: "notended",
    },
    sortBy: "timeRemaining",
  });

  if (tournomants.isSuccess && tournomants.data?.tournaments.length === 0) {
    return null;
  }

  return (
    <>
      <div className="w-full pb-2 flex justify-between items-center">
        <Typography variant="title2">Featured Contests</Typography>
        <Link
          href={"/play-2-win/"}
          className={`text-primary font-medium flex align-center`}
        >
          <span>All Contests</span>
          <ChevronRightIcon
            width={20}
            className="ml-1 -my-0.5"
          />
        </Link>
      </div>
      {tournomants.isError && (
        <CustomCard
          className="col-span-2"
          defaultPadding
        >
          <DataStatus
            status="searching"
            title={`Error${tournomants.error instanceof Error ? `: ${tournomants.error.name}` : ""}`}
            description={tournomants.error instanceof Error ? tournomants.error.message : "Error loading tournaments."}
          />
        </CustomCard>
      )}
      {tournomants.isLoading ? (
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className="bg-white rounded-md p-4 flex flex-col gap-3 items-center"
            >
              <Skeleton
                variant="rectangular"
                width={120}
                height={120}
                className="rounded-md"
              />
              <Skeleton
                variant="rectangular"
                width={80}
                height={36}
                className="rounded-md mt-2"
              />
            </div>
          ))}
        </div>
      ) : (
        <Swiper
          slidesPerView="auto"
          className="!-mx-4 !pe-8"
          spaceBetween={12}
          pagination
          autoHeight
          modules={[Pagination]}
          wrapperClass="swiper-wrapper pb-8 px-4"
        >
          {tournomants.data?.tournaments.map((tournament) => (
            <SwiperSlide
              className="!w-[160px]"
              key={tournament.id}
            >
              <TournamentCard
                key={tournament.id}
                tournament={tournament}
              />
            </SwiperSlide>
          ))}
        </Swiper>
      )}
    </>
  );
};

const OngoingEvents = () => {
  const ongoingEvents = trpc.events.getEventsWithFilters.useQuery({
    filter: {
      eventStatus: "ongoing",
    },
    sortBy: "random",
    limit: 2,
  });

  return (
    <>
      <div className="w-full pb-2 flex justify-between items-center">
        <Typography variant="title2">Ongoing Events</Typography>
        <Link
          href={"/search?" + new URLSearchParams({ ongoing: "true" }).toString()}
          className={`text-primary font-medium flex align-center`}
        >
          <span>Show more</span>
          <ChevronRightIcon
            width={20}
            className="ml-1 -my-0.5"
          />
        </Link>
      </div>
      {ongoingEvents.isError && (
        <CustomCard
          className="col-span-2"
          defaultPadding
        >
          <DataStatus
            status="searching"
            title={`Error${ongoingEvents.error instanceof Error ? `: ${ongoingEvents.error.name}` : ""}`}
            description={
              ongoingEvents.error instanceof Error ? ongoingEvents.error.message : "Error loading ongoing events."
            }
          />
        </CustomCard>
      )}
      {ongoingEvents.isLoading ? (
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className="bg-white rounded-md p-4 flex flex-col gap-3 items-center"
            >
              <Skeleton
                variant="rectangular"
                width={120}
                height={120}
                className="rounded-md"
              />
              <Skeleton
                variant="rectangular"
                width={80}
                height={36}
                className="rounded-md mt-2"
              />
            </div>
          ))}
        </div>
      ) : (
        ongoingEvents.data?.data?.map((event, idx) => (
          <EventCard
            key={idx}
            event={event}
            currentUserId={0}
          />
        ))
      )}
    </>
  );
};

const UpcomingEvents = () => {
  const upcomingEvents = trpc.events.getEventsWithFilters.useQuery({
    filter: {
      eventStatus: "upcoming",
    },
    sortBy: "start_date_asc",
    limit: 6,
  });

  // Helper function that groups events based on day (formatted as "Sep 10")
  const groupedEvents = useMemo(() => {
    const groups: { [day: string]: any[] } = {};

    upcomingEvents.data?.data?.forEach((event) => {
      // Convert the timestamp (in seconds) to a Date, then format it.
      const eventDate = new Date(event.startDate * 1000);
      const dayString = eventDate.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
      });

      if (!groups[dayString]) {
        groups[dayString] = [];
      }
      groups[dayString].push(event);
    });

    // Convert the groups object into the desired array format.
    return Object.entries(groups).map(([day, items]) => ({ day, items }));
  }, [upcomingEvents.data?.data?.length]);

  if (upcomingEvents.isError) {
    return (
      <CustomCard
        className="col-span-2"
        defaultPadding
      >
        <DataStatus
          status="searching"
          title={`Error${upcomingEvents.error instanceof Error ? `: ${upcomingEvents.error.name}` : ""}`}
          description={
            upcomingEvents.error instanceof Error ? upcomingEvents.error.message : "Error loading upcoming events."
          }
        />
      </CustomCard>
    );
  }

  if (upcomingEvents.isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, index) => (
          <div
            key={index}
            className="bg-white rounded-md p-4 flex flex-col gap-3 items-center"
          >
            <Skeleton
              variant="rectangular"
              width={120}
              height={120}
              className="rounded-md"
            />
            <Skeleton
              variant="rectangular"
              width={80}
              height={36}
              className="rounded-md mt-2"
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="w-full pb-2 flex justify-between items-center">
        <Typography variant="title2">Upcoming Events</Typography>
        <Link
          href={
            "/search?" +
            new URLSearchParams({
              ongoing: "true",
            }).toString()
          }
          className="text-primary font-medium flex align-center"
        >
          <span>Show more</span>
          <ChevronRightIcon
            width={20}
            className="ml-1 -my-0.5"
          />
        </Link>
      </div>
      <div className="border-s border-dashed border-brand-muted ps-2 isolate">
        {groupedEvents.map((group) => (
          <div key={group.day}>
            <h3 className="font-semibold w-full text-lg -mb-2 mt-3 -translate-y-1/2 relative">
              {group.day}
              <div className="rounded-full bg-black w-2 h-2 absolute -translate-x-1/2 -translate-y-1/2 -ms-2 top-1/2" />
            </h3>
            <div className="flex w-full flex-col">
              {group.items.map((event) => (
                <EventCard
                  key={event.event_uuid}
                  event={event}
                  currentUserId={0}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};
