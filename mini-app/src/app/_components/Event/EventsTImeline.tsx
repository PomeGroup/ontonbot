import { cn } from "@/utils";
import Skeleton from "@mui/material/Skeleton";
import React, { useMemo } from "react";
import EventCard, { EventCardProps } from "../EventCard/EventCard";

interface EventsTimelineProps {
  events: EventCardProps["event"][] | null;
  isLoading?: boolean;
  preserveDataOnFetching?: boolean; // if true, show existing data while loading
}

const EventsTimeline: React.FC<EventsTimelineProps> = ({ events, isLoading, preserveDataOnFetching }) => {
  // Helper function that groups events based on day (formatted as "Sep 10")
  const groupedEvents = useMemo(() => {
    const groups: { [day: string]: EventCardProps["event"][] } = {};

    events?.forEach((event) => {
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
  }, [events]);

  return (
    <div className="border-s border-dashed border-brand-muted ps-2 isolate">
      {(!isLoading || preserveDataOnFetching) &&
        groupedEvents.map((group, idx) => (
          <div key={group.day}>
            <h3 className={cn("font-semibold w-full text-lg relative mb-3", idx === 0 ? "-translate-y-1/2 mb-0" : "mt-4")}>
              {group.day}
              <div className="rounded-full bg-black w-2 h-2 absolute -translate-x-1/2 -translate-y-1/2 -ms-2 top-1/2" />
            </h3>
            <div className="flex w-full flex-col gap-2">
              {group.items.map((event) => (
                <EventCard
                  key={event.eventUuid}
                  event={event}
                  timeOnly
                />
              ))}
            </div>
          </div>
        ))}
      {isLoading && (
        <div className={`${preserveDataOnFetching ? "mt-4" : ""} animate-pulse`}>
          {/* Skeleton for date heading */}
          <div className="mb-4">
            <Skeleton
              variant="text"
              width={120}
              height={30}
            />
          </div>
          {/* Skeletons for events */}
          <div className="flex flex-col gap-2">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="mb-4"
              >
                <Skeleton
                  variant="rectangular"
                  width="100%"
                  height={80}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsTimeline;
