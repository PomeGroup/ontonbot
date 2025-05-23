"use client";

import DataStatus from "@/app/_components/molecules/alerts/DataStatus";
import PointDetailCard from "@/app/_components/myonton/points/PointDetailCard";
import { getNotFoundTitle, getTitle } from "@/app/_components/myonton/points/points.utils";
import { trpc } from "@/app/_trpc/client";
import Typography from "@/components/Typography";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { UsersScoreActivityType } from "@/db/schema/usersScore";
import { Skeleton } from "@mui/material";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { FaSpinner } from "react-icons/fa6";
import { IoInformationCircle } from "react-icons/io5";

const MyPointsDetailsPage = () => {
  const { type } = useParams();
  const router = useRouter();

  const scoreDetails = trpc.usersScore.getScoreDetail.useInfiniteQuery(
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
      <Typography variant="title3">{getTitle(type as UsersScoreActivityType)}</Typography>
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
        <div className="flex flex-col gap-2">
          {scoreDetails.data?.pages
            .flatMap((page) => page.items)
            .map((points) => (
              <PointDetailCard
                key={points.userScoreId + "-" + points.rewardId + "-" + points.eventId}
                imageUrl={points.imageUrl}
                eventTitle={points.eventTitle}
                eventStartDate={points.eventStartDate}
                eventEndDate={points.eventEndDate}
                tonSocietyStatus={points.tonSocietyStatus}
                userClaimedPoints={points.userClaimedPoints}
                rewardLink={points.rewardLink}
              />
            ))}
        </div>
      )}

      {/* Empty State */}
      {scoreDetails.isSuccess && scoreDetails.data?.pages.flatMap((page) => page.items).length === 0 && (
        <DataStatus
          status="not_found"
          size="lg"
          title={getNotFoundTitle(type as UsersScoreActivityType)}
          description={"Earn points by enjoying various activities on ONTON"}
          actionButton={
            <Link
              href="/"
              className="w-full"
            >
              <Button
                variant="primary"
                size="lg"
                className="w-full"
              >
                Explore Events
              </Button>
            </Link>
          }
        />
      )}

      {/* Load more if there are more items */}
      {scoreDetails.isSuccess && scoreDetails.hasNextPage && (
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
