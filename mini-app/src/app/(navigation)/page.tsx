"use client";
import EventCard from "@/app/_components/EventCard/EventCard";
import SearchBar from "@/app/_components/SearchBar/SearchBar";
import "@/app/page.css";
import EventBanner from "@/components/EventBanner";
import Typography from "@/components/Typography";
import { useConfig } from "@/context/ConfigContext";
import { Skeleton } from "@mui/material";
import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import TournamentCard from "../_components/Tournaments/TournamentCard";
import CustomCard from "../_components/atoms/cards/CustomCard";
import DataStatus from "../_components/molecules/alerts/DataStatus";
import { trpc } from "../_trpc/client";

import { cn } from "@/utils";
import { useMemo } from "react";
import CustomSwiper from "../_components/CustomSwiper";
import EventCardSkeleton from "../_components/EventCard/EventCardSkeleton";

export default function Home() {
  return (
    <>
      <div className="flex flex-col pt-3">
        <div className="w-full pb-3">
          <SearchBar />
        </div>

        <div className=" flex-grow">
          <div className="flex-grow flex flex-col gap-6">
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

  const {
    data: sliderEventData,
    isLoading: isLoadingSlider,
    isSuccess,
    isError,
  } = trpc.events.getEventsWithFilters.useQuery(sliderEventParams, {
    enabled: eventCount > 0,
    staleTime: Infinity,
  });

  // ------------ //
  //  🔴 ERROR    //
  // ------------ //
  if ((isSuccess && !sliderEventData?.data?.length) || isError) return null;

  // ------------ //
  //  🟡 LOADING  //
  // ------------ //
  let content = (
    <CustomSwiper>
      <EventBanner
        skeleton
        className="flex-[0_0_220px] h-[220px] !w-[220px]"
      />
      <EventBanner
        skeleton
        className="flex-[0_0_220px] h-[220px] !w-[220px]"
      />
      <EventBanner
        skeleton
        className="flex-[0_0_220px] h-[220px] !w-[220px]"
      />
    </CustomSwiper>
  );

  // ------------ //
  //  🟢 SUCCESS  //
  // ------------ //
  if (!isLoadingSlider) {
    content = (
      <CustomSwiper>
        {sliderEventData?.data.map((event) => (
          <EventBanner
            event={event}
            key={event.eventUuid}
          />
        ))}
      </CustomSwiper>
    );
  }

  return (
    <div>
      <Typography
        variant="title2"
        className="mb-3"
      >
        Featured Events{" "}
      </Typography>
      {content}
    </div>
  );
}

const FeaturedContests = () => {
  const tournomantsQuery = trpc.tournaments.getFeaturedTournaments.useQuery(undefined, {
    staleTime: Infinity,
  });

  const tournaments = tournomantsQuery.data;

  if (tournomantsQuery.isSuccess && !tournaments) {
    return null;
  }

  return (
    <div>
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
      {tournomantsQuery.isError && (
        <CustomCard
          className="col-span-2"
          defaultPadding
        >
          <DataStatus
            status="searching"
            title={`Error${tournomantsQuery.error instanceof Error ? `: ${tournomantsQuery.error.name}` : ""}`}
            description={
              tournomantsQuery.error instanceof Error ? tournomantsQuery.error.message : "Error loading tournaments."
            }
          />
        </CustomCard>
      )}
      {tournomantsQuery.isLoading ? (
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className="bg-white rounded-md p-4 flex flex-col gap-3 items-center"
            >
              <Skeleton
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
        <CustomSwiper>
          {tournaments?.map((tournament, idx) => (
            <TournamentCard
              key={`${tournament.id}-${idx}-1`}
              tournament={tournament}
            />
          ))}
        </CustomSwiper>
      )}
    </div>
  );
};

const OngoingEvents = () => {
  const ongoingEvents = trpc.events.getEventsWithFilters.useQuery(
    {
      filter: {
        eventStatus: "ongoing",
      },
      sortBy: "random",
      limit: 2,
    },
    {
      staleTime: Infinity,
    }
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="w-full pb-2 flex justify-between items-center">
        <Typography variant="title2">
          Ongoing Events{ongoingEvents.data?.totalCount ? `(${ongoingEvents.data?.totalCount})` : ""}
        </Typography>
        <Link
          href={"/search?" + new URLSearchParams({ eventStatus: "ongoing" }).toString()}
          className="text-primary font-medium flex align-center"
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
        <div className="flex flex-col gap-2">
          <div className="grid gap-4">
            {Array.from({ length: 2 }).map((_, index) => (
              <EventCardSkeleton key={index} />
            ))}
          </div>
        </div>
      ) : (
        ongoingEvents.data?.data?.map((event, idx) => (
          <EventCard
            key={idx}
            event={event}
          />
        ))
      )}
    </div>
  );
};

const UpcomingEvents = () => {
  const upcomingEvents = trpc.events.getEventsWithFilters.useQuery(
    {
      filter: {
        eventStatus: "upcoming",
      },
      sortBy: "start_date_asc",
      limit: 6,
    },
    {
      staleTime: Infinity,
    }
  );

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
      <div className="flex flex-col gap-2">
        <Typography variant="title2">Upcoming Events</Typography>
        <div className="grid gap-4">
          {Array.from({ length: 2 }).map((_, index) => (
            <EventCardSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="w-full pb-2 flex justify-between items-center">
        <Typography variant="title2">
          Upcoming Events{upcomingEvents.data?.totalCount ? `(${upcomingEvents.data?.totalCount})` : ""}
        </Typography>
        <Link
          href={
            "/search?" +
            new URLSearchParams({
              eventStatus: "upcoming",
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
        {groupedEvents.map((group, idx) => (
          <div key={group.day}>
            <h3 className={cn("font-semibold w-full text-lg relative mt-4 mb-3", idx === 0 && "-translate-y-1/2 mb-0")}>
              {group.day}
              <div className="rounded-full bg-black w-2 h-2 absolute -translate-x-1/2 -translate-y-1/2 -ms-2 top-1/2" />
            </h3>
            <div className="flex w-full flex-col gap-2">
              {group.items.map((event) => (
                <EventCard
                  key={event.event_uuid}
                  event={event}
                  timeOnly
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
