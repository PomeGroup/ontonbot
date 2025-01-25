import React from "react";

const EventCardSkeleton: React.FC = () => {
  const renderNormalModeSkeleton = () => (
    <div className="flex w-full py-4 gap-4 flex-nowrap relative overflow-hidden animate-pulse mb-4">
      <div className="w-24 h-24 shrink-0 rounded-lg relative overflow-hidden bg-gray-200 dark:bg-gray-700"></div>
      <div className="flex py-1 px-0 flex-col gap-2 grow flex-nowrap relative">
        <div className="flex items-center self-stretch flex-nowrap relative mb-1">
          <span className="h-5 grow shrink-0 basis-auto bg-gray-200 dark:bg-gray-700 rounded w-3/4"></span>
        </div>
        <div className="flex items-center self-stretch flex-nowrap relative w-[50%]">
          <span className="h-4 grow basis-auto bg-gray-200 dark:bg-gray-700 rounded w-full"></span>
        </div>
        <div className="flex justify-between w-full mt-auto">
          <span className="h-4 grow basis-auto bg-gray-200 dark:bg-gray-700 rounded max-w-[50%]"></span>
          <button className="h-3.5 w-9 shrink-0 bg-gray-200 dark:bg-gray-800 rounded border-none mt-auto">
            {/* <span className="h-3.5 shrink-0 basis-auto bg-gray-300 dark:bg-gray-600 rounded w-full mt-auto"></span> */}
          </button>
        </div>
      </div>
    </div>
  );

  return renderNormalModeSkeleton();
};

export default EventCardSkeleton;
