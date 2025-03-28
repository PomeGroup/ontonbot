import { Skeleton } from "@mui/material";
import React from "react";

interface EventCardSkeletonProps {
  className?: string;
}

const EventCardSkeleton: React.FC<EventCardSkeletonProps> = ({ className }) => {
  return (
    <div className={`bg-white rounded-[10px] overflow-hidden p-4 ${className ?? ""}`}>
      <div className="flex gap-4">
        {/* Left Image Skeleton */}
        <Skeleton
          variant="rectangular"
          width={100}
          height={100}
          className="rounded-lg"
        />

        {/* Right Content Skeleton */}
        <div className="flex flex-col flex-1 gap-2">
          <Skeleton
            variant="text"
            width="75%"
            height={20}
          />
          <Skeleton
            variant="text"
            width="50%"
            height={15}
          />

          <div className="flex justify-between items-end mt-auto">
            <Skeleton
              variant="text"
              width="50%"
              height={15}
            />
            <Skeleton
              variant="rectangular"
              width={36}
              height={14}
              className="rounded"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventCardSkeleton;
