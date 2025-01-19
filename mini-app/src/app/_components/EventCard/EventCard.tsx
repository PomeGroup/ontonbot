"use client";

import React, { ForwardedRef, forwardRef, memo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { IoIosPlayCircle } from "react-icons/io";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import useWebApp from "@/hooks/useWebApp";
import { formatDateRange, isValidTimezone } from "@/lib/DateAndTime";
import { isValidImageUrl } from "@/lib/isValidImageUrl";

interface EventCardProps {
  event: {
    eventUuid: string;
    title?: string;
    startDate: number;
    endDate: number;
    location?: string;
    imageUrl?: string;
    subtitle?: string;
    organizerFirstName?: string;
    organizerLastName?: string;
    organizerUsername?: string;
    organizerUserId?: number;
    ticketToCheckIn?: boolean;
    timezone?: string;
    reservedCount?: number;
    visitorCount?: number;
    ticketPrice?: number;
    city?: string;
    country?: string;
    participationType?: string;
  };
  currentUserId?: number;

  /**
   * If true, show an "Edit Event Info" button under the main event info.
   * If false or undefined, hide it.
   */
  canEdit?: boolean;

  /**
   * Callback when user clicks "Edit Event Info" button.
   * If not provided, the button doesn't appear or does nothing.
   */
  onEditClick?: () => void;
}

/**
 * This card shows event info, and if `canEdit` is true,
 * also shows an "Edit Event Info" button that calls `onEditClick`.
 */
function UnforwardedEventCard(
  { event, currentUserId = 0, canEdit, onEditClick }: EventCardProps,
  ref: ForwardedRef<HTMLDivElement> | null
) {
  // Destructure event fields
  const {
    eventUuid,
    title = "No Title",
    startDate,
    endDate,
    location = "No Location",
    imageUrl = "/template-images/default.webp",
    organizerFirstName = "Unknown",
    organizerLastName = "",
    organizerUserId = null,
    ticketToCheckIn = false,
    timezone = "GMT",
    ticketPrice = 0,
    city = null,
    country = null,
    participationType = "unknown",
  } = event;

  const defaultImage = "/template-images/default.webp";
  const [imageLoaded, setImageLoaded] = useState(false);

  // If time zone is invalid, fallback
  const validTimezone = isValidTimezone(timezone) ? timezone : "GMT";

  // Build location display
  const geoLocation =
    city || country ? `${city}, ${country}` : location.length > 15 ? `${location.slice(0, 15)}...` : location;

  const isOnline = participationType === "online" ? "Online" : participationType === "in_person" ? geoLocation : "unknown";

  const isOngoing = startDate < Date.now() && endDate > Date.now();

  // We open the card or route
  const webApp = useWebApp();
  const router = useRouter();

  const handleEventClick = () => {
    // If ticketToCheckIn => open Telegram link
    if (ticketToCheckIn) {
      webApp?.openTelegramLink(`https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME}/event?startapp=${eventUuid}`);
    } else {
      // Otherwise, push to /events/[eventUuid]
      router.push(`/events/${eventUuid}`);
    }
  };

  // Skeleton loader while image not loaded
  const renderImageSkeleton = () => (
    <div className="w-full h-full bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg"></div>
  );

  return (
    <>
      <div
        ref={ref}
        onClick={handleEventClick}
        className="flex w-full gap-4 items-start flex-nowrap relative overflow-hidden cursor-pointer"
      >
        {/* LEFT: Event Image */}
        <div className="relative overflow-hidden rounded-lg w-24 h-24 flex-shrink-0">
          {!imageLoaded && renderImageSkeleton()}
          <Image
            src={isValidImageUrl(imageUrl) ? imageUrl : defaultImage}
            alt={title}
            layout="fill"
            style={{ objectFit: "cover" }}
            className={`rounded-lg transition-opacity duration-500 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
            onError={(e) => (e.currentTarget.src = defaultImage)}
            onLoad={() => setImageLoaded(true)}
            loading="lazy"
            unoptimized={true}
          />
        </div>

        {/* MIDDLE: Event Info */}
        <div className="flex gap-1 items-center self-stretch grow flex-nowrap relative">
          <div className="flex flex-col gap-1 items-start self-stretch grow flex-nowrap relative">
            {/* Top line with date range or "Now" + price */}
            <div className="flex items-center self-stretch flex-nowrap relative">
              <span className="grow font-sans text-gray-600 dark:text-gray-400 text-left whitespace-nowrap text-sm leading-3">
                {isOngoing ? (
                  <div className="flex items-center text-green-500 animate-pulse">
                    <IoIosPlayCircle className="mr-1" /> Now
                  </div>
                ) : (
                  <span className="grow font-sans text-gray-600 dark:text-gray-400 text-left whitespace-nowrap text-sm leading-3">
                    {formatDateRange(startDate, endDate, validTimezone)} · {isOnline}
                  </span>
                )}
              </span>
              {/* Badge on the right: "hosted" if user is the organizer, else price */}
              {currentUserId === organizerUserId ? (
                <Badge variant="ontonDark">hosted</Badge>
              ) : (
                <Badge variant="ontonDark">{ticketPrice > 0 ? ticketPrice : "free"}</Badge>
              )}
            </div>

            {/* Title */}
            <div className="flex gap-1.5 items-center self-stretch flex-nowrap relative">
              <span className="font-sans whitespace-normal text-black dark:text-white text-left line-clamp-2 text-lg font-semibold leading-5.5">
                {title}
              </span>
            </div>

            {/* Organizer */}
            <span className="font-sans text-left line-clamp-1 text-xs leading-4">
              by {organizerFirstName} {organizerLastName}
            </span>
          </div>
        </div>
      </div>

      {/* If user can edit => show an "Edit Event Info" button below the card. 
          We stop propagation so it doesn't trigger handleEventClick. */}
      {canEdit && onEditClick && (
        <div className="mt-2 flex">
          <button
            className="bg-blue-500 text-white px-3 py-1 rounded"
            onClick={(e) => {
              e.stopPropagation();
              onEditClick();
            }}
          >
            Edit Event Info
          </button>
        </div>
      )}

      {/* A line separator */}
      <Separator className="my-4 bg-[#545458]" />
    </>
  );
}

// Use memo + forwardRef
const UnmemorizedEventCard = forwardRef(UnforwardedEventCard);
const EventCard = memo(UnmemorizedEventCard, (prevProps, nextProps) => {
  // Compare event UUID to avoid re-renders
  return prevProps.event.eventUuid === nextProps.event.eventUuid;
});

EventCard.displayName = "EventCard";
export default EventCard;
