"use client";

import CustomCard from "@/app/_components/atoms/cards/CustomCard";
import Skeleton from "@mui/material/Skeleton";

const LeaderboardLoading: React.FC = () => {
  return (
    <div className="w-full max-w-md mx-auto p-4 bg-gray-100 min-h-screen">
      <CustomCard className="mb-6 p-4">
        {/* LeaderBoard Header Skeleton */}
        <Skeleton
          variant="text"
          width={120}
          height={24}
          className="mb-2"
        />
        <Skeleton
          variant="text"
          width="80%"
          height={16}
          className="mb-4"
        />

        {/* Top Three Participants Skeleton */}
        <div className="flex justify-between items-end mb-6 bg-[#C8C7CB33] rounded-[30px] p-4">
          {Array(3)
            .fill(0)
            .map((_, index) => (
              <div
                key={index}
                className="flex flex-col items-center relative"
              >
                {index === 1 && (
                  <Skeleton
                    variant="text"
                    width={30}
                    height={30}
                    className="-top-4 absolute -rotate-[35deg] left-1"
                  />
                )}
                <Skeleton
                  variant="circular"
                  width={index === 1 ? 64 : 56}
                  height={index === 1 ? 64 : 56}
                  className={index === 1 ? "border-2 border-blue-500" : "border-2 border-transparent"}
                />
                <Skeleton
                  variant="rectangular"
                  width={50}
                  height={20}
                  className={index === 1 ? "mt-1 rounded-full bg-blue-500" : "mt-1 rounded-full"}
                />
              </div>
            ))}
        </div>

        {/* Remaining Participants Skeleton */}
        <div className="space-y-3">
          {Array(3)
            .fill(0)
            .map((_, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Skeleton
                    variant="text"
                    width={30}
                    height={16}
                  />
                  <Skeleton
                    variant="circular"
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                  <Skeleton
                    variant="text"
                    width={100}
                    height={16}
                  />
                </div>
                <Skeleton
                  variant="text"
                  width={30}
                  height={16}
                />
              </div>
            ))}
        </div>
      </CustomCard>
    </div>
  );
};

export default LeaderboardLoading;
