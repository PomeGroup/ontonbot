import Image from "next/image";
import React, { useState } from "react";
import { isValidTimezone } from "@/lib/DateAndTime";
import { isValidImageUrl } from "@/lib/isValidImageUrl";
interface EventCardProps {
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
}

const EventCard: React.FC<{ event: EventCardProps }> = ({ event }) => {
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
    //· ${startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: validTimezone })}
    return `${startDate.toLocaleDateString("en-US", startOptions)}${sameDay ? "" : ` - ${endDate.toLocaleDateString("en-US", endOptions)}`} `;
  };

  const isOnline = website || location.includes("http") ? "Online" : location;

  const organizerLink = organizer_username
    ? `https://t.me/${organizer_username}`
    : organizer_user_id
      ? `tg://user?id=${organizer_user_id}`
      : null;

  return (
    <div className="flex w-full pt-4 pr-4 pb-4 pl-0 gap-4 items-start flex-nowrap relative overflow-hidden">
      <div className="w-24 h-24 shrink-0 rounded-lg relative overflow-hidden">
        <Image
          src={src}
          alt={title}
          layout="fill"
          objectFit="cover"
          className="rounded-lg"
          onError={(e) => {
            setSrc(defaultImage);
          }}
        />
      </div>
      <div className="flex gap-1 items-center self-stretch grow flex-nowrap relative">
        <div className="flex pt-1 pr-0 pb-3 pl-0 flex-col gap-1 items-start self-stretch grow flex-nowrap relative">
          <div className="flex items-center self-stretch flex-nowrap relative">
            <span className="h-4 grow shrink-0 basis-auto font-sans text-sm font-normal leading-4 text-gray-600 dark:text-gray-400 relative text-left whitespace-nowrap">
              {formatDateRange(start_date, end_date, validTimezone)} ·{" "}
              {isOnline}
            </span>
            {ticket_price > 0 && (
              <button className="flex w-9 pt-0.5 pr-1 pb-0 pl-1 items-center shrink-0 flex-nowrap bg-gray-200 dark:bg-gray-800 rounded-md border-none relative overflow-hidden">
                <span className="h-3.5 shrink-0 basis-auto font-sans text-xs font-medium leading-3.5 text-black dark:text-white relative text-left whitespace-nowrap">
                  ${ticket_price}
                </span>
              </button>
            )}
          </div>
          <div className="flex gap-1.5 items-center self-stretch flex-nowrap relative">
            <span className="h-5.5 grow basis-auto font-sans text-lg font-semibold leading-5.5 text-black dark:text-white relative text-left line-clamp-2">
              {title}
            </span>
          </div>
          {organizerLink ? (
            <a
              href={organizerLink}
              className="h-5.5 grow basis-auto font-sans text-xs font-normal leading-5.5 text-black dark:text-white relative text-left line-clamp-1"
            >
              by {organizer_first_name} {organizer_last_name}
            </a>
          ) : (
            <span className="h-5.5 grow basis-auto font-sans text-xs font-normal leading-5.5 text-black dark:text-white relative text-left line-clamp-1">
              by {organizer_first_name} {organizer_last_name}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventCard;
