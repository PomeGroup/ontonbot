import { Card } from "konsta/react";
import React from "react";

const EventCardSkeleton: React.FC = ({ className }: { className?: string }) => {
  return (
    <Card
      className={`overflow-hidden radius-[10px] ${className}`}
      margin="mb-3"
      contentWrapPadding="p-2">
      <div className="flex w-full gap-4 flex-nowrap relative overflow-hidden animate-pulse">
        <div className="basis-[100px] h-[100px] shrink-0 rounded-lg relative overflow-hidden bg-gray-200 dark:bg-gray-700"></div>
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
    </Card>
  );
};

export default EventCardSkeleton;
