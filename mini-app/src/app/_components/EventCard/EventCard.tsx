"use client";

import React, { ForwardedRef, forwardRef, memo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import useWebApp from "@/hooks/useWebApp";
import { formatDateRange, isValidTimezone } from "@/lib/DateAndTime";
import { isValidImageUrl } from "@/lib/isValidImageUrl";
import { Card } from "konsta/react";
import Typography from "@/components/Typography";


interface EventCardProps {
  event: {
    eventUuid: string;
    title?: string;
    startDate: number;
    endDate: number;
    location?: string;
    imageUrl?: string;
    subtitle?: string;
    organizerChannelName?: string;
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
  children?: React.ReactNode;
}

/**
 * This card shows event info, and if `canEdit` is true,
 * also shows an "Edit Event Info" button that calls `onEditClick`.
 */
function UnforwardedEventCard(
  { event, currentUserId = 0, children }: EventCardProps,
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
    organizerChannelName = "",
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
    <Card
      className="overflow-hidden cursor-pointer radius-[10px]"
      margin="mb-3"
      contentWrapPadding="p-2"
    >
      <div
        className='flex gap-4 items-stretch flex-nowrap relative'
        ref={ref}
        onClick={handleEventClick}
      >
        {/* LEFT: Event Image */}
        <div className="relative rounded-lg max-w-[100px] min-w-[100px] flex-shrink-0">
          {!imageLoaded && renderImageSkeleton()}
          <Image
            src={isValidImageUrl(imageUrl) ? imageUrl : defaultImage}
            alt={title}
            width={100}
            height={100}
            className={`w-25 h-25 rounded-[6px] transition-opacity duration-500 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
            onError={(e) => (e.currentTarget.src = defaultImage)}
            onLoad={() => setImageLoaded(true)}
            loading="lazy"
            unoptimized={true}
          />
        </div>

        <div className="flex flex-col grow">
          <Typography className="font-semibold mb-1 line-clamp-2 overflow-hidden" variant="body">
            {title}
          </Typography>
          {organizerChannelName.trim().length > 0 && (
            <Typography
              className="font-medium"
              variant="subheadline2"
            >by {organizerChannelName}</Typography>
          )}
          <div className='mt-auto text-[#8E8E93]'>
            <Typography variant="subheadline2" className="font-medium mb-1">
              {isOnline}
            </Typography>
            <div className="flex justify-between">
              <Typography variant='subheadline2' className="font-medium">
                {formatDateRange(startDate, endDate, validTimezone)}
              </Typography>
              <div className="flex gap-[6px]">

                {/* Badge on the right: "hosted" if user is the organizer, else price */}
                {currentUserId === organizerUserId && (
                  <Badge variant="ontonLight">hosted</Badge>
                )}
                <Badge variant="ontonLight">{ticketPrice > 0 ? `$${ticketPrice}` : "Free"}</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
      {children}
    </Card>
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

