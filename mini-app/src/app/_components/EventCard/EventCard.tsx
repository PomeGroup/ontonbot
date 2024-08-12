import Image from "next/image";
import React, { useState } from "react";
import { isValidTimezone } from "@/lib/DateAndTime";
import { isValidImageUrl } from "@/lib/isValidImageUrl";
import { formatDate, formatDateRange } from "@/lib/DateAndTime";
import useWebApp from "@/hooks/useWebApp";

interface EventCardProps {
  event: {
    event_uuid: string;
    title?: string;
    start_date: number;
    end_date: number;
    location?: string;
    image_url?: string;
    subtitle?: string;
    organizer_first_name?: string;
    organizer_last_name?: string;
    organizer_username?: string;
    organizer_user_id?: number;
    ticketToCheckIn?: boolean;
    timezone?: string;
    website?: string | null;
    reserved_count?: number;
    visitor_count?: number;
    ticket_price?: number;
  };
  mode?: "normal" | "small" | "detailed";
}

const EventCard: React.FC<EventCardProps> = ({ event, mode = "normal" }) => {
  const {
    event_uuid,
    title = "No Title",
    start_date,
    end_date,
    location = "No Location",
    image_url = "/ton-logo.png",
    subtitle = "No Subtitle",
    organizer_first_name = "Unknown",
    organizer_last_name = "",
    organizer_username = null,
    organizer_user_id = null,
    ticketToCheckIn = false,
    timezone = "GMT",
    website = null,
    reserved_count = 0,
    visitor_count = 0,
    ticket_price = 0,
  } = event;
  const webApp = useWebApp();
  const defaultImage = "/ton-logo.png";
  const [src, setSrc] = useState(
      isValidImageUrl(image_url) ? image_url : defaultImage
  );


  const validTimezone = isValidTimezone(timezone) ? timezone : "GMT";
  const isOnline = website || location.includes("http") ? "Online" : location;
  const organizerLink = organizer_username
      ? `https://t.me/${organizer_username}`
      : organizer_user_id
          ? `tg://user?id=${organizer_user_id}`
          : null;

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
        <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col justify-between p-6 text-white">
          <div>
            <div className="flex justify-between items-start">
              <div className="text-sm">TON Syndicate</div>
              <div className="text-xs bg-white text-black px-2 py-1 rounded">
                Organized by {organizer_first_name} {organizer_last_name}
              </div>
            </div>
            <h2 className="text-3xl font-bold mt-2">{title}</h2>
            <h3 className="text-lg">{subtitle}</h3>
          </div>
          <div className="flex justify-between items-center text-sm">
            <div>{location}</div>
            <div>
              {formatDate(start_date)} ·{" "}
              {new Date(start_date * 1000).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        </div>
      </div>
  );

  const renderSmallMode = () => (
      <a
          href={`/event/${event_uuid}`}
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
              {formatDateRange(start_date, end_date, validTimezone)} ·{" "}
              {isOnline}
            </span>
              {ticket_price > 0 && (
                  <button className="flex items-center shrink-0 rounded-md border-none relative overflow-hidden w-7 p-1">
                <span className="font-sans text-black dark:text-white text-left whitespace-nowrap text-sm leading-3">
                  ${ticket_price}
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
            by {organizer_first_name} {organizer_last_name}
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
          <a href="#"
             onClick={() => {



               webApp?.openTelegramLink(
                   `https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME}/event?startapp=${event_uuid}`
               );
               webApp?.close();
             }}
          >
            <Image
                src={src}
                alt={title}
                layout="fill"

                style={{objectFit: "cover"  }}
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
              {formatDateRange(start_date, end_date, validTimezone)} ·{" "}
              {isOnline}
            </span>
              {ticket_price > 0 && (
                  <button className="flex items-center shrink-0 rounded-md border-none relative overflow-hidden w-9 p-2">
                <span className="font-sans text-black dark:text-white text-left whitespace-nowrap text-xs leading-3.5">
                  ${ticket_price}
                </span>
                  </button>
              )}
            </div>
            <div className="flex gap-1.5 items-center self-stretch flex-nowrap relative">
              <a href={`/event/${event_uuid}`} className="grow">
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
                  by {organizer_first_name} {organizer_last_name}
                </a>
            ) : (
                <span className="grow font-sans text-left line-clamp-1 text-xs leading-5.5">
              by {organizer_first_name} {organizer_last_name}
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