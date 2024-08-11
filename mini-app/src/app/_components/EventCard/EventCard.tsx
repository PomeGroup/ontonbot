import Image from "next/image";
import React, { useState } from "react";
import { isValidTimezone } from "@/lib/DateAndTime";
import { isValidImageUrl } from "@/lib/isValidImageUrl";

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
  mode?: "normal" | "small"; // Add mode as a prop here
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

  const defaultImage = "/ton-logo.png";
  const [src, setSrc] = useState(
      isValidImageUrl(image_url) ? image_url : defaultImage
  );
  const validTimezone = isValidTimezone(timezone) ? timezone : "GMT";

  const formatDateRange = (
      start: number,
      end: number,
      timezone: string
  ): string => {
    if (!start || !end) return "Date not available";

    const startDate = new Date(start * 1000);
    const endDate = new Date(end * 1000);

    const startOptions: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
    };
    const sameDay = startDate.toDateString() === endDate.toDateString();
    const endOptions = sameDay ? {} : startOptions;
    return `${startDate.toLocaleDateString("en-US", startOptions)}${sameDay ? "" : ` - ${endDate.toLocaleDateString("en-US", endOptions)}`} `;
  };

  const isOnline = website || location.includes("http") ? "Online" : location;

  const organizerLink = organizer_username
      ? `https://t.me/${organizer_username}`
      : organizer_user_id
          ? `tg://user?id=${organizer_user_id}`
          : null;

  return (
      <div className={`flex w-full ${mode === "small" ? "p-2 gap-2" : "p-4 gap-4"} items-start flex-nowrap relative overflow-hidden`}>
        <div className={`relative overflow-hidden rounded-lg ${mode === "small" ? "w-12 h-12" : "w-24 h-24"}`}>
          <Image
              src={src}
              alt={title}
              layout="fill"
              objectFit="cover"
              className="rounded-lg"
              onError={() => setSrc(defaultImage)}
          />
        </div>
        <div className="flex gap-1 items-center self-stretch grow flex-nowrap relative">
          <div className={`flex flex-col ${mode === "small" ? "gap-0" : "gap-1"} items-start self-stretch grow flex-nowrap relative`}>
            <div className="flex items-center self-stretch flex-nowrap relative">
            <span className={`grow font-sans text-gray-600 dark:text-gray-400 text-left whitespace-nowrap ${mode === "small" ? "text-xs leading-4" : "text-sm leading-4"}`}>
              {formatDateRange(start_date, end_date, validTimezone)} · {isOnline}
            </span>
              {ticket_price > 0 && (
                  <button className={`flex items-center shrink-0 rounded-md border-none relative overflow-hidden ${mode === "small" ? "w-7 p-1" : "w-9 p-2"}`}>
                <span className={`font-sans text-black dark:text-white text-left whitespace-nowrap ${mode === "small" ? "text-sm leading-3" : "text-xs leading-3.5"}`}>
                  ${ticket_price}
                </span>
                  </button>
              )}
            </div>
            <div className="flex gap-1.5 items-center self-stretch flex-nowrap relative">
            <span className={`grow font-sans text-black dark:text-white text-left line-clamp-2 ${mode === "small" ? "text-xs font-medium leading-2" : "text-lg font-semibold leading-5.5"}`}>
              {title}
            </span>
            </div>
            {organizerLink ? (
                <a
                    href={organizerLink}
                    className={`grow font-sans text-left line-clamp-1 ${mode === "small" ? "text-xs leading-2 text-gray-600 dark:text-gray-400" : "text-xs leading-5.5"}`}
                >
                  by {organizer_first_name} {organizer_last_name}
                </a>
            ) : (
                <span className={`grow font-sans text-left line-clamp-1   ${mode === "small" ? "text-xs leading-2 text-gray-600 dark:text-gray-400" : "text-xs leading-5.5"}`}>
              by {organizer_first_name} {organizer_last_name}
            </span>
            )}
          </div>
        </div>
      </div>
  );
};

export default EventCard;
