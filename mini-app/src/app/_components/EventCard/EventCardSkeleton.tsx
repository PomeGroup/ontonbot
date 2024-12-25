import React from "react";

interface EventCardSkeletonProps {
  mode?: "normal" | "small" | "detailed";
}

const EventCardSkeleton: React.FC<EventCardSkeletonProps> = ({ mode = "normal" }) => {
  const renderNormalModeSkeleton = () => (
    <div className="flex w-full pt-4 pr-4 pb-4 pl-0 gap-4 items-start flex-nowrap relative overflow-hidden animate-pulse mb-4">
      <div className="w-24 h-24 shrink-0 rounded-lg relative overflow-hidden bg-gray-200 dark:bg-gray-700"></div>
      <div className="flex gap-1 items-center self-stretch grow flex-nowrap relative">
        <div className="flex pt-1 pr-0 pb-3 pl-0 flex-col gap-1 items-start self-stretch grow flex-nowrap relative">
          <div className="flex items-center self-stretch flex-nowrap relative">
            <span className="h-4 grow shrink-0 basis-auto bg-gray-200 dark:bg-gray-700 rounded w-3/4"></span>
            <button className="flex w-9 pt-0.5 pr-1 pb-0 pl-1 items-center shrink-0 flex-nowrap bg-gray-200 dark:bg-gray-800 rounded-md border-none relative overflow-hidden">
              <span className="h-3.5 shrink-0 basis-auto bg-gray-300 dark:bg-gray-600 rounded w-full"></span>
            </button>
          </div>
          <div className="flex gap-1.5 items-center self-stretch flex-nowrap relative">
            <span className="h-5.5 grow basis-auto bg-gray-200 dark:bg-gray-700 rounded w-full"></span>
          </div>
          <span className="h-5.5 grow basis-auto bg-gray-200 dark:bg-gray-700 rounded w-1/2"></span>
        </div>
      </div>
    </div>
  );

  const renderSmallModeSkeleton = () => (
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

  const renderDetailedModeSkeleton = () => (
    <div className="relative w-full h-60 rounded-lg overflow-hidden shadow-lg animate-pulse mb-4">
      <div className="absolute inset-0 w-full h-full bg-gray-200 dark:bg-gray-700"></div>
      <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col justify-between p-6">
        <div>
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
        </div>
      </div>
    </div>
  );

  if (mode === "detailed") {
    return renderDetailedModeSkeleton();
  } else if (mode === "small") {
    return renderSmallModeSkeleton();
  } else {
    return renderNormalModeSkeleton();
  }
};

export default EventCardSkeleton;
