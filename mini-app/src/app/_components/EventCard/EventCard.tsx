"use client";

import { Calendar, Clock, MapPin } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { type ForwardedRef } from "react";

import Typography from "@/components/Typography";
import { Badge } from "@/components/ui/badge";
import useWebApp from "@/hooks/useWebApp";
import { cn } from "@/utils";
import CustomCard from "../atoms/cards/CustomCard";

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
    hidden?: number;
    paymentType?: string;
    organizerImageUrl?: string;
    // Has
    hasApproval?: boolean | null;
    hasPayment?: boolean | null;
    hasRegistration?: boolean | null;
  };
  currentUserId?: number;
  timeOnly?: boolean;
  noClick?: boolean;
}

/**
 * Event card component that displays event information in a clean, modern layout
 */
function EventCard(
  { event, currentUserId = 0, timeOnly, noClick }: EventCardProps,
  ref: ForwardedRef<HTMLDivElement> | null
) {
  // ------------------------- //
  //          HOOKS            //
  // ------------------------- //
  const webApp = useWebApp();
  const router = useRouter();

  // Destructure event fields
  const {
    eventUuid,
    title = "No Title",
    startDate,
    location = "No Location",
    imageUrl = "/placeholder.svg?height=200&width=200",
    organizerChannelName = "",
    organizerUserId = null,
    ticketToCheckIn = false,
    ticketPrice = 0,
    city = null,
    country = null,
    participationType = "unknown",
    hidden = false,
    paymentType = "unknown",
    organizerImageUrl,

    // ---------- has properties
    hasRegistration,
    hasPayment,
  } = event;

  // Build location display
  const displayLocation = city && country ? `${city}, ${country}` : location;

  // Format location for display (truncate if needed)
  const formattedLocation = displayLocation.length > 30 ? `${displayLocation.slice(0, 30)}...` : displayLocation;

  // Determine event participation type
  const isOnline = participationType === "online";

  // Determine currency for ticket price
  const validCurrencies = ["USDT", "TON"];
  const currency = validCurrencies.includes(paymentType?.toUpperCase()) ? paymentType?.toUpperCase() : "";

  const handleEventClick = () => {
    // If noClick prop is set, do nothing
    if (noClick) return;

    // If ticketToCheckIn => open Telegram link
    if (hasPayment || ticketToCheckIn) {
      webApp?.openTelegramLink(`https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME}/event?startapp=${eventUuid}`);
    } else {
      // Otherwise, push to /events/[eventUuid]
      router.push(`/events/${eventUuid}`);
    }
  };

  // Format date and time for display
  const start = new Date(startDate);
  const datePart = start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const timePart = start.toLocaleTimeString("en-US", { hour: "numeric", minute: "numeric", hour12: true });
  const formattedDate = timeOnly ? `${timePart}` : `${datePart} | ${timePart}`;

  if (hidden) return null;

  return (
    <div
      onClick={handleEventClick}
      className={cn(!noClick && "cursor-pointer")}
    >
      <CustomCard className="p-2">
        <div className="grid grid-cols-[100px_1fr] gap-4">
          {/* Event Image */}
          <Image
            src={imageUrl || "/placeholder.svg"}
            alt={title}
            width={100}
            height={100}
            className="overflow-hidden object-contain !w-[100px] h-[100px] rounded-md self-center"
          />

          {/* Event Details */}
          <div className="flex flex-col overflow-hidden">
            {/* Event Title */}
            <Typography
              variant="headline"
              className="mb-2 line-clamp-2"
            >
              {title}
            </Typography>

            {/* Date and Time */}
            <div className="flex items-center text-gray-500 mb-1">
              {timeOnly ? (
                <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
              ) : (
                <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
              )}
              <Typography
                variant="subheadline2"
                className="truncate"
              >
                {formattedDate}
              </Typography>
            </div>

            {/* Location */}
            <div className="flex items-center text-gray-500 mb-2">
              <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
              <Typography
                variant="subheadline2"
                className="truncate"
              >
                {isOnline ? (hasRegistration ? "Register to see" : location) : formattedLocation}
              </Typography>
            </div>

            {/* Bottom row with organizer and badges */}
            <div className="flex items-center justify-between mt-auto gap-2 flex-wrap">
              {/* Organizer or Hosting Status */}
              <div className="flex items-center">
                {organizerChannelName ? (
                  <div className="flex items-center !max-w-32">
                    {organizerImageUrl && (
                      <div className="relative w-6 h-6 rounded-full overflow-hidden mr-2">
                        <Image
                          src={organizerImageUrl || "/placeholder.svg"}
                          alt={organizerChannelName}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <Typography
                      variant="subheadline2"
                      className="text-blue-500 truncate"
                      truncate
                    >
                      {organizerChannelName}
                    </Typography>
                  </div>
                ) : null}
              </div>

              {/* Tags/Badges */}
              <div className="flex gap-2 flex-wrap justify-self-end justify-end">
                <Badge className="rounded-md px-1 font-normal text-xs bg-gray-200 text-gray-700 hover:bg-gray-200 hover:text-gray-700">
                  {isOnline ? "Online" : "In-Person"}
                </Badge>

                <Badge className="rounded-md px-1 font-normal text-xs bg-gray-200 text-gray-700 hover:bg-gray-200 hover:text-gray-700">
                  {ticketPrice > 0 ? `${ticketPrice} ${currency}` : "Free"}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </CustomCard>
    </div>
  );
}

export default EventCard;
