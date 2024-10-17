import EventCardSkeleton from "@/app/_components/EventCard/EventCardSkeleton";
import { OntonEvent } from "@/types/event.types";
import { ReactNode } from "react";

export interface EventSectionProps {
  title?: string;
  seeAllLink?: string;
  isLoading: boolean;
  events: OntonEvent[];
  renderEvent: (event: OntonEvent) => ReactNode;
}

function EventSection({
  title,
  seeAllLink,
  isLoading,
  events,
  renderEvent,
}: EventSectionProps) {
  if (isLoading && events.length === 0) {
    return (
      <>
        <EventCardSkeleton />
        <EventCardSkeleton />
      </>
    );
  }

  if (events.length === 0) {
    return null;
  }

  return (
    <>
      {title && (
        <div className="pt-4 w-full pb-4 flex justify-between items-center">
          <h2 className="font-bold text-lg">{title}</h2>
          {seeAllLink && (
            <a
              href={seeAllLink}
              className="text-zinc-300 hover:underline"
            >
              See All
            </a>
          )}
        </div>
      )}
      {events.map(renderEvent)}
    </>
  );
}

export default EventSection;
