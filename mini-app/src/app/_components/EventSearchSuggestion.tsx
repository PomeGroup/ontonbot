import React, { useCallback, useEffect, useState, useRef } from "react";
import { trpc } from "@/app/_trpc/client";
import searchEventsInputZod from "@/zodSchema/searchEventsInputZod";
import { debounce } from "lodash";
import { FaTimes } from "react-icons/fa";
import useSearchEventsStore from "@/zustand/searchEventsInputZod";
import useWebApp from "@/hooks/useWebApp";
import Image from "next/image";
import { isValidImageUrl } from "@/lib/isValidImageUrl";
import { formatDateRange, isValidTimezone } from "@/lib/DateAndTime";
import { Separator } from "@/components/ui/separator";

interface EventSearchSuggestionProps {
  searchTerm: string;
  onClose: () => void;
  autoSuggestions: any[];
  setAutoSuggestions: (_value: any[]) => void;
  handleFilterApply: (_value: any[]) => void;
  handleAutoSuggestionAllResults: (_value: any[]) => void;
}

const EventSearchSuggestion: React.FC<EventSearchSuggestionProps> = ({
  searchTerm,
  onClose,
  autoSuggestions,
  setAutoSuggestions,
  handleAutoSuggestionAllResults,
}) => {
  const [searchLoading, setSearchLoading] = useState(false);
  const suggestionBoxRef = useRef<HTMLDivElement>(null);
  const { searchInput } = useSearchEventsStore();
  const { refetch } = trpc.events.getEventsWithFilters.useQuery(
    searchEventsInputZod.parse({
      limit: 4,
      offset: 0,
      search: searchTerm,
      filter: {
        startDate: searchInput?.filter?.startDate || undefined,
        startDateOperator: searchInput?.filter?.startDateOperator || ">=",
        endDate: searchInput?.filter?.endDate || undefined,
        endDateOperator: searchInput?.filter?.endDateOperator || "<=",
        participationType: searchInput?.filter?.participationType || ["online", "in_person"],
        society_hub_id: searchInput?.filter?.society_hub_id || [],
        user_id: searchInput?.filter?.user_id || undefined,
      },
      sortBy: searchInput?.sortBy || "default",
    }),
    {
      enabled: false,
      onSuccess: (data) => {
        setAutoSuggestions(data?.data || []);
        setSearchLoading(false);
      },
      onError: () => {
        setAutoSuggestions([]);
        setSearchLoading(false);
      },
    }
  );

  const debouncedFetchSearchResults = useCallback(
    debounce(() => {
      setSearchLoading(true);
      refetch().then((r) => console.log(r));
    }, 300),
    [refetch]
  );

  useEffect(() => {
    if (searchTerm.length > 2) {
      debouncedFetchSearchResults();
    } else {
      setAutoSuggestions([]);
    }
  }, [searchTerm, debouncedFetchSearchResults]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionBoxRef.current && !suggestionBoxRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  return (
    <div
      ref={suggestionBoxRef}
      className="absolute pt-4 w-full bg-white border-cn-muted border rounded-xl shadow-lg z-50"
    >
      {searchLoading ? (
        <div className="p-2">
          {Array.from({ length: 1 }).map((_, index) => (
            <SmallEventSkeleton key={index} />
          ))}
        </div>
      ) : autoSuggestions?.length > 0 ? (
        <>
          {autoSuggestions.map((event) => (
            <SmallEventCard
              event={event}
              key={event.eventUuid}
            />
          ))}
          <button
            className="w-full text-s text-center py-2 h-8 flex items-center justify-center"
            onClick={handleAutoSuggestionAllResults as any}
          >
            <span>All Results</span>
          </button>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between p-2">
            <div className="text-sm">No Results Found</div>
            <button onClick={onClose}>
              <FaTimes />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default EventSearchSuggestion;

function SmallEventSkeleton() {
  return (
    <div className="flex w-full p-2 gap-2 cursor-pointer items-start flex-nowrap relative overflow-hidden animate-pulse">
      <div className="w-12 h-12 shrink-0 rounded-lg relative overflow-hidden bg-gray-200 dark:bg-gray-700"></div>
      <div className="flex gap-1 pl-2 items-center self-stretch grow flex-nowrap relative">
        <div className="flex flex-col gap-1 items-start self-stretch grow flex-nowrap relative">
          <div className="flex gap-1.5 items-center self-stretch flex-nowrap relative">
            <span className="h-5 grow basis-auto bg-gray-200 dark:bg-gray-700 rounded w-full"></span>
          </div>
          <span className="h-2 grow basis-auto bg-gray-200 dark:bg-gray-700 rounded w-1/2"></span>
        </div>
      </div>
    </div>
  );
}

interface SmallEventCardProps {
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
}

const eventDefautImage = "/template-images/default.webp";

function SmallEventCard({ event }: SmallEventCardProps) {
  const {
    ticketToCheckIn,
    eventUuid,
    imageUrl = eventDefautImage,
    title = "No Title",
    startDate,
    endDate,
    timezone = "GMT",
    participationType,
    organizerFirstName,
    organizerLastName,
    city,
    country,
    location = "No Location",
  } = event;

  const webApp = useWebApp();
  const handleEventClick = () => {
    if (ticketToCheckIn) {
      webApp?.openTelegramLink(`https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME}/event?startapp=${eventUuid}`);
    } else {
      window.location.href = `/events/${eventUuid}`;
      return false;
    }
  };
  const [imageLoaded, setImageLoaded] = useState(false);

  // Skeleton Loader for Image
  const renderImageSkeleton = () => (
    <div className="w-full h-full bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg"></div>
  );
  const validTimezone = isValidTimezone(timezone) ? timezone : "GMT";
  const geoLocation =
    city || country ? `${city}, ${country}` : location.length > 15 ? `${location.slice(0, 15)}...` : location;

  const isOnline = participationType === "online" ? "Online" : participationType === "in_person" ? geoLocation : "unknown";

  return (
    <>
      <div
        onClick={handleEventClick}
        className="flex w-full p-2 gap-2 items-start flex-nowrap relative overflow-hidden cursor-pointer"
        key={`small-${eventUuid}`}
      >
        <div className="relative overflow-hidden rounded-lg w-12 h-12 flex-shrink-0">
          {!imageLoaded && renderImageSkeleton()}
          <Image
            src={isValidImageUrl(imageUrl) ? imageUrl : eventDefautImage}
            alt={title}
            layout="fill"
            objectFit="cover"
            style={{ objectFit: "cover" }}
            className={`rounded-lg transition-opacity duration-500 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
            loading="lazy"
            onError={(e) => (e.currentTarget.src = eventDefautImage)}
            onLoad={() => setImageLoaded(true)}
            unoptimized={true}
          />
        </div>
        <div className="flex gap-1 pl-2 items-center self-stretch grow flex-nowrap relative">
          <div className="flex flex-col gap-0 items-start self-stretch grow flex-nowrap relative">
            <div className="flex items-center self-stretch flex-nowrap relative">
              <span className="grow font-sans text-gray-600 dark:text-gray-400 text-left whitespace-nowrap text-xs leading-3">
                {formatDateRange(startDate, endDate, validTimezone)} · {isOnline}
              </span>
            </div>
            <div className="flex gap-1.5 items-center self-stretch flex-nowrap relative">
              <span className="grow font-sans whitespace-normal text-black dark:text-white text-left line-clamp-1 text-sm font-medium leading-2">
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
}
