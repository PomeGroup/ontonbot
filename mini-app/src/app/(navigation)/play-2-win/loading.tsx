"use client";
import CustomSwiper from "@/app/_components/CustomSwiper";
import Typography from "@/components/Typography";
import { Skeleton } from "@mui/material";

export default function Loading() {
  return (
    <div className="animate-pulse space-y-6 p-4">
      {/* Featured Contests Skeleton */}
      <div>
        <Typography variant="title2">
          <Skeleton width={200} />
        </Typography>
        <CustomSwiper>
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton
              key={index}
              variant="rectangular"
              width={220}
              height={220}
              className="rounded-md"
            />
          ))}
        </CustomSwiper>
      </div>
      {/* Discover Tournaments Skeleton */}
      <div>
        <Typography variant="title2">
          <Skeleton width={150} />
        </Typography>
        <div className="grid grid-cols-[repeat(auto-fill,_minmax(160px,_1fr))] gap-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="flex flex-col gap-2"
            >
              <Skeleton
                variant="rectangular"
                width="100%"
                height={120}
                className="rounded-md"
              />
              <Skeleton
                variant="rectangular"
                width="60%"
                height={36}
                className="rounded-md"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
