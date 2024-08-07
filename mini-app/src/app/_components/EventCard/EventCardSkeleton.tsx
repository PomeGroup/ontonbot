import React from "react";

const EventCardSkeleton: React.FC = () => {
    return (
        <div className="flex w-full pt-4 pr-4 pb-4 pl-0 gap-4 items-start flex-nowrap relative overflow-hidden animate-pulse">
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
};

export default EventCardSkeleton;
