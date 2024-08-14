import { formatDateRange, isValidTimezone } from "@/lib/DateAndTime";
import { isValidImageUrl } from "@/lib/isValidImageUrl";
import Image from "next/image";
import React, { useState } from "react";

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
}

const EventCard: React.FC<EventCardProps> = ({ event, mode = "normal" }) => {
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

  const validTimezone = isValidTimezone(timezone) ? timezone : "GMT";
  const isOnline = website || location.includes("http") ? "Online" : location;
  const organizerLink = organizerUsername
      ? `https://t.me/${organizerUsername}`
      : organizerUserId
          ? `tg://user?id=${organizerUserId}`
          : null;
  const eventLink = ticketToCheckIn
      ? `/ptma/events/?tgWebAppStartParam=${eventUuid}`
      : `/events/${eventUuid}`;

  const renderDetailedMode = () => (
      <div className="relative w-full h-60 rounded-lg overflow-hidden shadow-lg">
        <Image
            src={src}
            alt={title}
            layout="fill"
            objectFit="cover"
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover"
            onError={() => setSrc(defaultImage)}
        />
      </div>
  );

  const renderSmallMode = () => (
      <a
          href={`/event/${eventUuid}`}
          className="flex w-full p-2 gap-2 cursor-pointer items-start flex-nowrap relative overflow-hidden"
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
              {ticketPrice > 0 && (
                  <button className="flex items-center shrink-0 rounded-md border-none relative overflow-hidden w-7 p-1">
                <span className="font-sans text-black dark:text-white text-left whitespace-nowrap text-sm leading-3">
                  ${ticketPrice}
                </span>
                  </button>
              )}
            </div>
            <div className="flex gap-1.5 items-center self-stretch flex-nowrap relative">
            <span className="grow font-sans text-black dark:text-white text-left line-clamp-2 text-xs font-medium leading-2">
              {title}
            </span>
            </div>
            <span className="grow font-sans text-left line-clamp-1 text-xs leading-2 text-gray-600 dark:text-gray-400">
            by {organizerFirstName} {organizerLastName}
          </span>
          </div>
        </div>
      </a>
  );

  const renderNormalMode = () => (
      <div
          className={`flex w-full pt-4 gap-4 items-start flex-nowrap relative overflow-hidden`}
      >
        <div className="relative overflow-hidden rounded-lg w-24 h-24 flex-shrink-0">
          <a href={eventLink}>
            <Image
                src={src}
                alt={title}
                layout="fill"
                style={{ objectFit: "cover" }}
                className="rounded-lg"
                onError={() => setSrc(defaultImage)}
                loading="lazy"
            />
          </a>
        </div>
        <div className="flex gap-1 items-center self-stretch grow flex-nowrap relative">
          <div className="flex flex-col gap-1 items-start self-stretch grow flex-nowrap relative">
            <div className="flex items-center self-stretch flex-nowrap relative">
            <span className="grow font-sans text-gray-600 dark:text-gray-400 text-left whitespace-nowrap text-sm leading-4">
              {formatDateRange(startDate, endDate, validTimezone)} · {isOnline}
            </span>
              {ticketPrice > 0 && (
                  <button className="flex items-center shrink-0 rounded-md border-none relative overflow-hidden w-9 p-2">
                <span className="font-sans text-black dark:text-white text-left whitespace-nowrap text-xs leading-3.5">
                  ${ticketPrice}
                </span>
                  </button>
              )}
            </div>
            <div className="flex gap-1.5 items-center self-stretch flex-nowrap relative">
              <a href={eventLink} className="grow">
              <span className="font-sans text-black dark:text-white text-left line-clamp-2 text-lg font-semibold leading-5.5">
                {title}
              </span>
              </a>
            </div>
            {organizerLink ? (
                <a
                    href={organizerLink}
                    className="grow font-sans text-left line-clamp-1 text-xs leading-5.5"
                >
                  by {organizerFirstName} {organizerLastName}
                </a>
            ) : (
                <span className="grow font-sans text-left line-clamp-1 text-xs leading-5.5">
              by {organizerFirstName} {organizerLastName}
            </span>
            )}
          </div>
        </div>
      </div>
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
