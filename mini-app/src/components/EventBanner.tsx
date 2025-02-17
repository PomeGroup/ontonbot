import useWebApp from "@/hooks/useWebApp";
import Image from "next/image";
import { useState } from "react";
import { isValidImageUrl } from "@/lib/isValidImageUrl";
import { OntonEvent } from "@/types";
import { cn } from "@/utils";
import { useRouter } from "next/navigation";

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
  const router = useRouter();

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
      router.push(`/events/${eventUuid}`);
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

function EventBannerSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={`relative w-full aspect-square rounded-lg bg-grey-200 overflow-hidden shadow-lg animate-pulse mb-4 ${className}`}
    >
      {/* <div className="absolute inset-0 w-full h-full bg-gray-200 dark:bg-gray-700"></div> */}
      {/* <div>
          <div className="flex justify-between items-start">
            <div className="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="w-32 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
          <div className="mt-2 w-3/4 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="mt-2 w-1/2 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
        <div className="flex justify-between items-center text-sm">
          <div className="w-32 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="w-20 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div> */}
    </div>
    // </div >
  );
}
