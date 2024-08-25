import { formatDateRange, isValidTimezone } from "@/lib/DateAndTime";
import { isValidImageUrl } from "@/lib/isValidImageUrl";
import Image from "next/image";
import React, { useState, useCallback } from "react";
import useWebApp from "@/hooks/useWebApp";
import { Badge } from "@/components/ui/badge" ;
import {Separator} from "@/components/ui/separator";
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
    website?: string | null;
    reservedCount?: number;
    visitorCount?: number;
    ticketPrice?: number;
  };
  mode?: "normal" | "small" | "detailed";
  currentUserId?: number;
}

const EventCard: React.FC<EventCardProps> = ({ event, mode = "normal" ,currentUserId= 0 }) => {
  const {
    eventUuid,
    title = "No Title",
    startDate,
    endDate,
    location = "No Location",
    imageUrl = "/ton-logo.png",
    subtitle = "No Subtitle",
    organizerFirstName = "Unknown",
    organizerLastName = "",
    organizerUsername = null,
    organizerUserId = null,
    ticketToCheckIn = false,
    timezone = "GMT",
    website = null,
    reservedCount = 0,
    visitorCount = 0,
    ticketPrice = 0,
  } = event;

  const defaultImage = "/ton-logo.png";
  const [src, setSrc] = useState(
    isValidImageUrl(imageUrl) ? imageUrl : defaultImage
  );
  const webApp = useWebApp();
  const validTimezone = isValidTimezone(timezone) ? timezone : "GMT";
  const isOnline = website || location.includes("http") ? "Online" : location;

  const handleEventClick = () => {
    if (ticketToCheckIn) {
      webApp?.openTelegramLink(
        `https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME}/event?startapp=${eventUuid}`
      );
    } else {
      window.location.href = `/events/${eventUuid}`; // Correct usage of window.location.href
      return false;
    }
  };

  const renderDetailedMode = () => (
    <div
      className="relative w-full h-auto overflow-hidden shadow-lg  cursor-pointer"
      onClick={handleEventClick}
    >
      <Image
        src={src}
        alt={title}
        width={400}
        height={400}
        className="w-full h-auto object-cover"
        onError={() => setSrc(defaultImage)}
      />
    </div>
  );

  const renderSmallMode = () => (
    <>
      <div
        onClick={handleEventClick}
        className="flex w-full p-2 gap-2 items-start flex-nowrap relative overflow-hidden cursor-pointer"
      >
        <div className="relative overflow-hidden rounded-lg w-12 h-12 flex-shrink-0">
          <Image
            src={src}
            alt={title}
            layout="fill"
            objectFit="cover"
            className="rounded-lg"
            loading="lazy"
            onError={() => setSrc(defaultImage)}
          />
        </div>
        <div className="flex gap-1 pl-2 items-center self-stretch grow flex-nowrap relative">
          <div className="flex flex-col gap-0 items-start self-stretch grow flex-nowrap relative">
            <div className="flex items-center self-stretch flex-nowrap relative">
              <span className="grow font-sans text-gray-600 dark:text-gray-400 text-left whitespace-nowrap text-xs leading-4">
                {formatDateRange(startDate, endDate, validTimezone)} · {isOnline}
              </span>

            </div>
            <div className="flex gap-1.5 items-center self-stretch flex-nowrap relative">
              <span className="grow font-sans text-black dark:text-white text-left line-clamp-1 text-sm font-medium leading-2">
                {title}
              </span>
            </div>
            <span className="grow font-sans text-left line-clamp-1 text-xs leading-2 text-gray-600 dark:text-gray-400">
              by {organizerFirstName} {organizerLastName}
            </span>
          </div>
        </div>
      </div>
      <Separator className="my-0 bg-[#545458]" />
    </>
  );

  const renderNormalMode = () => (
      <>
        <div
          onClick={handleEventClick}
          className={`flex w-full   gap-4 items-start flex-nowrap relative overflow-hidden cursor-pointer`}
        >
          <div className="relative overflow-hidden rounded-lg w-24 h-24 flex-shrink-0">
            <Image
              src={src}
              alt={title}
              layout="fill"
              style={{ objectFit: "cover" }}
              className="rounded-lg"
              onError={() => setSrc(defaultImage)}
              loading="lazy"
            />
          </div>
          <div className="flex gap-1 items-center self-stretch grow flex-nowrap relative">
            <div className="flex flex-col gap-1 items-start self-stretch grow flex-nowrap relative">
              <div className="flex items-center self-stretch flex-nowrap relative">
                <span className="grow font-sans text-gray-600 dark:text-gray-400 text-left whitespace-nowrap text-sm leading-4">
                  {formatDateRange(startDate, endDate, validTimezone)} · {isOnline}
                </span>
                {ticketPrice > 0 ? (
                  <Badge  variant="ontonDark"  >

                      ${ticketPrice}

                  </Badge>
                ) : (
                    <Badge  variant="ontonDark"  >
                    { currentUserId === organizerUserId ? "hosted" : "free" }

                    </Badge>
                )}
              </div>
              <div className="flex gap-1.5 items-center self-stretch flex-nowrap relative ">
                <span className="font-sans text-black dark:text-white text-left line-clamp-2 text-lg font-semibold leading-5.5">
                  {title}
                </span>
              </div>
              <span className="grow font-sans text-left line-clamp-1 text-xs leading-5.5">
                by {organizerFirstName} {organizerLastName}
              </span>
            </div>
          </div>
        </div>
        <Separator className="my-4 bg-[#545458]" />
      </>
  );

  if (mode === "detailed") {
    return renderDetailedMode();
  } else if (mode === "small") {
    return renderSmallMode();
  } else {
    return renderNormalMode();
  }
};

export default EventCard;
