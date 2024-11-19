"use client";
import React, { useEffect, useState } from "react";
import EventCard from "@/app/_components/EventCard/EventCard";
import EventCardSkeleton from "@/app/_components/EventCard/EventCardSkeleton";
import SearchBar from "@/app/_components/SearchBar/SearchBar";
import useAuth from "@/hooks/useAuth";
import searchEventsInputZod from "@/zodSchema/searchEventsInputZod";
import { trpc } from "../_trpc/client";
import "../page.css";
import { useConfig } from "@/context/ConfigContext";
import "swiper/css";
import { useWithBackButton } from "@/app/_components/atoms/buttons/web-app/useWithBackButton";

// Define types for events
type EventData = any[];

export default function Home() {
  const { config } = useConfig();

  useWithBackButton({
    whereTo: "/",
  });

  //

  const eventUUID = "6acf01ed-3122-498a-a937-329766b459aa";
  const sideEventUUIDs = config?.gatewaySideEvents?.split(",");
  console.log(config?.gatewaySideEvents);

  const { authorized, role: userRole } = useAuth();

  // Store the last scroll positions of each tab

  // Fetch parameters
  const sliderEventParams = searchEventsInputZod.parse({
    limit: 1,
    filter: {
      event_uuids: [eventUUID],
    },
  });
  const slideEventParams = searchEventsInputZod.parse({
    limit: 90,
    filter: {
      event_uuids: sideEventUUIDs,
    },
  });
  // Local state to avoid unnecessary re fetches
  const [sliderEventsState, setSliderEventsState] = useState<EventData>([]);
  const [sideEventsState, setSideEventsState] = useState<EventData>([]);

  // Queries without caching
  const { data: sliderEventData, isLoading: isLoadingSlider } =
    trpc.events.getEventsWithFilters.useQuery(sliderEventParams, {
      cacheTime: 10000,
      enabled: sliderEventsState.length === 0,
    });

  const { data: sideEventData, isLoading: isLoadingSide } =
    trpc.events.getEventsWithFilters.useQuery(slideEventParams, {
      cacheTime: 10000,
      enabled: sliderEventsState.length === 0,
    });
  useEffect(() => {
    if (sliderEventData?.data && sliderEventData?.data?.length > 0)
      setSliderEventsState(sliderEventData.data);
    if (sideEventData?.data && sideEventData?.data?.length > 0)
      setSideEventsState(sideEventData.data);
  }, [sliderEventData, sideEventData]);
  return (
    <>
      <div className="flex flex-col h-screen">
        {/* Fixed Search Bar */}
        <div className="sticky top-0 z-50 w-full bg-[#1C1C1E] pb-1">
          {/*<SearchBar*/}
          {/*  includeQueryParam={false}*/}
          {/*  onUpdateResults={() => {}}*/}
          {/*  userRole={authorized ? userRole : "user"}*/}
          {/*/>*/}
          {/* Slider Event */}
          {isLoadingSlider && sliderEventsState.length === 0 ? (
            <>
              <EventCardSkeleton mode={"detailed"} />
              <EventCardSkeleton mode={"detailed"} />
            </>
          ) : (
            sliderEventsState.length > 0 && (
              <>
                <div className="pt-4 w-full pb-4 flex justify-between items-center">
                  <h2 className="font-bold text-lg">Gateway Main Events</h2>
                </div>
                <EventCard
                  event={sliderEventsState[0]}
                  mode={"normal_without_dropdown"}
                />
              </>
            )
          )}

          {isLoadingSide && sideEventsState.length === 0 ? (
            <>
              <EventCardSkeleton />
              <EventCardSkeleton />
            </>
          ) : (
            sideEventsState.length > 0 && (
              <>
                <div className="pt-4 w-full pb-4 flex justify-between items-center">
                  <h2 className="font-bold text-lg">Gateway Side Events</h2>
                </div>
                {sideEventsState.map((event) => (
                  <EventCard
                    key={event.event_uuid}
                    event={event}
                    mode={"normal_without_dropdown"}
                  />
                ))}
              </>
            )
          )}
        </div>
      </div>
    </>
  );
}
