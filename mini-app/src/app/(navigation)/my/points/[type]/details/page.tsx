"use client";

import CustomCard from "@/app/_components/atoms/cards/CustomCard";
import { trpc } from "@/app/_trpc/client";
import Typography from "@/components/Typography";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { UsersScoreActivityType } from "@/db/schema/usersScore";
import { formatDateRange, formatTime } from "@/lib/DateAndTime";
import { Skeleton } from "@mui/material";
import { AwardIcon, CheckIcon, XIcon } from "lucide-react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { FaSpinner } from "react-icons/fa6";
import { IoInformationCircle } from "react-icons/io5";

const MyPointsDetailsPage = () => {
  const { type } = useParams();
  const router = useRouter();

  const scoreDetails = trpc.usersScore.getEventsWithClaimAndScoreInfinite.useInfiniteQuery(
    {
      limit: 10,
      activityType: type as UsersScoreActivityType,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

  useEffect(() => {
    if (scoreDetails.isError && scoreDetails.error.data?.httpStatus === 404) {
      router.push("/my/points");
    }
  }, [scoreDetails.isError, router]);

  return (
    <div className="p-4 flex flex-col gap-4">
      <Typography variant="title3">Participated {decodeURI(type as string)}</Typography>
      <div>
        <Alert variant={"info"}>
          <IoInformationCircle
            size={24}
            className="text-info-dark flex-shrink-0"
          />
          <p>
            Your points refresh every 3 hour for 3 weeks. If your event has just wrapped up, hang tight—you'll see your
            points credited soon!
          </p>
        </Alert>
      </div>
      {scoreDetails.isLoading && (
        <div className="flex flex-col gap-4">
          <Skeleton
            variant="rounded"
            height={100}
          />
          <Skeleton
            variant="rounded"
            height={100}
          />
          <Skeleton
            variant="rounded"
            height={100}
          />
        </div>
      )}

      {scoreDetails.isSuccess && (
        <div className="flex flex-col gap-4">
          {scoreDetails.data?.pages
            .flatMap((page) => page.items)
            .map((event) => (
              <CustomCard
                key={event.eventId}
                className="p-2"
              >
                <div className="flex items-center gap-2">
                  {/* Event Image */}
                  <Image
                    src={event.imageUrl || "/template-images/default.webp"}
                    alt={event.eventTitle}
                    width={65}
                    height={65}
                    className="overflow-hidden object-cover rounded-md self-center aspect-square"
                  />

                  {/* Event Details */}
                  <div className="flex flex-col flex-1 overflow-hidden items-start justify-start gap-[3.5px]">
                    {/* Event Title */}
                    <Typography
                      variant="callout"
                      className="line-clamp-1 leading-[17px]"
                    >
                      {event.eventTitle}
                    </Typography>

                    {/* Date and Time */}
                    <div
                      title={
                        new Date(event.eventStartDate * 1000).toString() +
                        " - " +
                        new Date(event.eventEndDate * 1000).toString()
                      }
                      className="flex flex-col items-start text-gray-500"
                    >
                      <Typography
                        variant="subheadline2"
                        className="truncate"
                      >
                        {formatDateRange(event.eventStartDate, event.eventEndDate)} |{" "}
                        {formatTime(new Date(event.eventStartDate * 1000))} -{" "}
                        {formatTime(new Date(event.eventEndDate * 1000))}
                      </Typography>
                    </div>

                    {/* Reward Status */}
                    <>
                      {event.tonSocietyStatus === "NOT_CLAIMED" && (
                        <Typography
                          variant="subheadline2"
                          className="truncate text-brand-light-destructive flex items-center justify-center gap-1"
                        >
                          <XIcon className="w-4 h-4 flex-shrink-0" />
                          <span>Unclaimed</span>
                        </Typography>
                      )}
                      {(event.tonSocietyStatus === "CLAIMED" || event.tonSocietyStatus === "RECEIVED") && (
                        <Typography
                          variant="subheadline2"
                          className="truncate text-brand-green flex items-center justify-center gap-1"
                        >
                          <CheckIcon className="w-4 h-4 flex-shrink-0" />
                          <span>Claimed</span>
                        </Typography>
                      )}
                      {event.tonSocietyStatus === "NOT_ELIGIBLE" && (
                        <Typography
                          variant="subheadline2"
                          className="truncate text-brand-muted flex items-center justify-center gap-1"
                        >
                          <XIcon className="w-4 h-4 flex-shrink-0 opacity-50" />
                          <span>Not eligible</span>
                        </Typography>
                      )}
                    </>
                  </div>

                  {/* Claim Button */}
                  <>
                    {event.tonSocietyStatus === "NOT_CLAIMED" && (
                      <Button
                        variant="outline"
                        className="flex items-center gap-1 rounded-md flex-1 max-w-[96px]"
                      >
                        <AwardIcon className="w-4 h-4" />
                        <span>Claim</span>
                      </Button>
                    )}
                    {(event.tonSocietyStatus === "CLAIMED" || event.tonSocietyStatus === "RECEIVED") && (
                      <div className="flex flex-col gap-2 items-center">
                        <Typography variant="callout">{event.userClaimedPoints}</Typography>
                        <Typography variant="caption2">Points</Typography>
                      </div>
                    )}
                  </>
                </div>
              </CustomCard>
            ))}
        </div>
      )}

      {/* Load more if there are more items */}
      {scoreDetails.hasNextPage && (
        <Button
          variant="link"
          className="flex items-center gap-1 rounded-md flex-1 mx-auto max-w-[96px] text-primary font-medium"
          onClick={() => scoreDetails.fetchNextPage()}
          disabled={scoreDetails.isFetchingNextPage}
        >
          {scoreDetails.isFetchingNextPage ? (
            <div className="flex items-center gap-2">
              <FaSpinner
                className="w-4 h-4 animate-spin"
                size={16}
              />
              <span>Loading...</span>
            </div>
          ) : (
            "Load more"
          )}
        </Button>
      )}
    </div>
  );
};

export default MyPointsDetailsPage;
