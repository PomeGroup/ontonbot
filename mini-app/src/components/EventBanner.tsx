import useWebApp from "@/hooks/useWebApp";
import Image from "next/image";
import { useState } from "react";
import { isValidImageUrl } from "@/lib/isValidImageUrl";
import { OntonEvent } from "@/types";
import { cn } from "@/utils";

type SkeletonProps = { skeleton: true; event?: null };
type EventProps = {
  skeleton?: false;
  event: OntonEvent;
  className?: string;
};

type Props = (SkeletonProps | EventProps) & {
  className?: string;
};

const defaultImage = "/template-images/default.webp";

const emptyObj = {} as any;
export default function EventBanner({ skeleton, event, className }: Props) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const webApp = useWebApp();

  const {
    eventUuid,
    title = "No Title",
    imageUrl = "/template-images/default.webp",
    ticketToCheckIn = false,
  } = event || emptyObj;

  const handleEventClick = () => {
    if (ticketToCheckIn) {
      webApp?.openTelegramLink(`https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME}/event?startapp=${eventUuid}`);
    } else {
      window.location.href = `/events/${eventUuid}`;
      return false;
    }
  };

  // Skeleton Loader for Image
  const renderImageSkeleton = () => (
    <div className="w-full h-full bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg"></div>
  );

  return (
    <div
      className={cn("relative w-full h-auto overflow-hidden cursor-pointer", className)}
      onClick={handleEventClick}
      key={`detailed-${eventUuid}`}
    >
      {(!imageLoaded || skeleton) && renderImageSkeleton()}
      {!skeleton && (
        <Image
          // if date now before 5 november 2024 show special image
          src={isValidImageUrl(imageUrl) ? imageUrl : defaultImage}
          alt={title}
          width={0}
          height={0}
          sizes="100vw"
          className={`aspect-square w-[220px] rounded-[10px] transition-opacity duration-250 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
          onError={(e) => (e.currentTarget.src = defaultImage)}
          onLoad={() => setImageLoaded(true)}
        />
      )}
    </div>
  );
}
