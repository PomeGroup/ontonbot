import React from "react";
import { formatDateRange, isValidTimezone } from "@/lib/DateAndTime";
import { isValidImageUrl } from "@/lib/isValidImageUrl";
import Image from "next/image";
import useWebApp from "@/hooks/useWebApp";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  IoChevronForwardOutline,
  IoReorderFour,
  IoSettingsOutline,
} from "react-icons/io5";
import { IoIosPlayCircle } from "react-icons/io";

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
    city?: string;
    country?: string;
  };
  mode?: "normal" | "small" | "detailed" | "ongoing";
  currentUserId?: number;
}

const EventCard: React.FC<EventCardProps> = ({
  event,
  mode = "normal",
  currentUserId = 0,
}) => {
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
    website = null,
    ticketPrice = 0,
    city = null,
    country = null,
  } = event;

  const defaultImage = "/template-images/default.webp";

  const webApp = useWebApp();
  const validTimezone = isValidTimezone(timezone) ? timezone : "GMT";
  const geoLocation = city || country ? `${city}, ${country}` : location;
  const isOnline =
    website || location.includes("http") ? "Online" : geoLocation;

  const handleEventClick = () => {
    if (ticketToCheckIn) {
      webApp?.openTelegramLink(
        `https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME}/event?startapp=${eventUuid}`
      );
    } else {
      window.location.href = `/events/${eventUuid}`;
      return false;
    }
  };

  const renderDropdownMenu = () => (
    <DropdownMenu key={`dropdown-${eventUuid}`}>
      <DropdownMenuTrigger asChild>
        <div className="flex w-full gap-4 items-start flex-nowrap relative overflow-hidden cursor-pointer">
          <div className="relative overflow-hidden rounded-lg w-24 h-24 flex-shrink-0">
            <Image
              src={isValidImageUrl(imageUrl) ? imageUrl : defaultImage}
              alt={title}
              layout="fill"
              style={{ objectFit: "cover" }}
              className="rounded-lg"
              onError={(e) => (e.currentTarget.src = defaultImage)}
              loading="lazy"
            />
          </div>
          <div className="flex gap-1 items-center self-stretch grow flex-nowrap relative">
            <div className="flex flex-col gap-1 items-start self-stretch grow flex-nowrap relative">
              <div className="flex items-center self-stretch flex-nowrap relative">
                <span className="grow font-sans text-gray-600 dark:text-gray-400 text-left whitespace-nowrap text-sm leading-4">
                  {mode === "ongoing" ? (
                    <div className="flex items-center text-green-500 animate-pulse">
                      <IoIosPlayCircle className="mr-1" /> Now
                    </div>
                  ) : (
                    <span className="grow font-sans text-gray-600 dark:text-gray-400 text-left whitespace-nowrap text-sm leading-4">
                      {formatDateRange(startDate, endDate, validTimezone)} ·{" "}
                      {isOnline}
                    </span>
                  )}
                </span>
                {currentUserId === organizerUserId ? (
                    <Badge variant="ontonDark">hosted</Badge>
                ) : (
                    <Badge variant="ontonDark">
                      { ticketPrice > 0 ? ticketPrice : "free"}
                    </Badge>
                )}
              </div>
              <div className="flex gap-1.5 items-center self-stretch flex-nowrap relative">
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
      </DropdownMenuTrigger>
      <DropdownMenuContent
        key={`dropdown-show-${eventUuid}`}
        align="center"
        className="mt-[-10px] w-[220px]  bg-black px-3 rounded-none border-spacing-1 border-2 border-gray-600"
      >
        <DropdownMenuItem
          className="text-lg px-2 rounded-none "
          onClick={handleEventClick}
        >
          <IoReorderFour className="mr-1" /> Show Event{" "}
          <IoChevronForwardOutline className="ml-auto" />
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          key={`dropdown-manage-${eventUuid}`}
          className="text-lg  px-2 rounded-none "
          onClick={() => {
            window.location.href = `/events/${eventUuid}/edit`;
            return false;
          }}
        >
          <IoSettingsOutline className="mr-1" /> Manage Event{" "}
          <IoChevronForwardOutline className="ml-auto" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const renderNormalMode = () => (
    <>
      {currentUserId === organizerUserId ? (
        renderDropdownMenu()
      ) : (
        <div
          onClick={handleEventClick}
          className="flex w-full gap-4 items-start flex-nowrap relative overflow-hidden cursor-pointer"
        >
          <div className="relative overflow-hidden rounded-lg w-24 h-24 flex-shrink-0">
            <Image
              src={isValidImageUrl(imageUrl) ? imageUrl : defaultImage}
              alt={title}
              layout="fill"
              style={{ objectFit: "cover" }}
              className="rounded-lg"
              onError={(e) => (e.currentTarget.src = defaultImage)}
              loading="lazy"
            />
          </div>
          <div className="flex gap-1 items-center self-stretch grow flex-nowrap relative">
            <div className="flex flex-col gap-1 items-start self-stretch grow flex-nowrap relative">
              <div className="flex items-center self-stretch flex-nowrap relative">
                <span className="grow font-sans text-gray-600 dark:text-gray-400 text-left whitespace-nowrap text-sm leading-4">
                  {mode === "ongoing" ? (
                    <div className="flex items-center text-green-500 animate-pulse">
                      <IoIosPlayCircle className="mr-1" /> Now
                    </div>
                  ) : (
                    <span className="grow font-sans text-gray-600 dark:text-gray-400 text-left whitespace-nowrap text-sm leading-4">
                      {formatDateRange(startDate, endDate, validTimezone)} ·{" "}
                      {isOnline}
                    </span>
                  )}
                </span>
                {currentUserId === organizerUserId ? (
                  <Badge variant="ontonDark">hosted</Badge>
                ) : (
                  <Badge variant="ontonDark">
                    { ticketPrice > 0 ? ticketPrice : "free"}
                  </Badge>
                )}
              </div>
              <div className="flex gap-1.5 items-center self-stretch flex-nowrap relative">
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
      )}
      <Separator className="my-4 bg-[#545458]" />
    </>
  );

  const renderDetailedMode = () => (
    <div
      className="relative w-full h-auto overflow-hidden shadow-lg cursor-pointer"
      onClick={handleEventClick}
    >
      <Image
        src={isValidImageUrl(imageUrl) ? imageUrl : defaultImage}
        alt={title}
        width={400}
        height={400}
        className="w-full h-auto object-cover"
        onError={(e) => (e.currentTarget.src = defaultImage)}
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
            src={isValidImageUrl(imageUrl) ? imageUrl : defaultImage}
            alt={title}
            layout="fill"
            objectFit="cover"
            className="rounded-lg"
            loading="lazy"
            onError={(e) => (e.currentTarget.src = defaultImage)}
          />
        </div>
        <div className="flex gap-1 pl-2 items-center self-stretch grow flex-nowrap relative">
          <div className="flex flex-col gap-0 items-start self-stretch grow flex-nowrap relative">
            <div className="flex items-center self-stretch flex-nowrap relative">
              <span className="grow font-sans text-gray-600 dark:text-gray-400 text-left whitespace-nowrap text-xs leading-4">
                {formatDateRange(startDate, endDate, validTimezone)} ·{" "}
                {isOnline}
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

  if (mode === "detailed") {
    return renderDetailedMode();
  } else if (mode === "small") {
    return renderSmallMode();
  } else {
    return renderNormalMode();
  }
};

export default EventCard;
