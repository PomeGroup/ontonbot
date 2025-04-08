"use client";

import { trpc } from "@/app/_trpc/client";
import { useUserStore } from "@/context/store/user.store";
import { useState } from "react";
import ChevronDownIconAccord from "./ChevronDownIcon";
import EventPointsCard from "./EventPointsCard";
import EventPointsGroup from "./EventPointsGroup";
import TotalPointsBox from "./TotalPointsBox";

export default function MyPointsPage() {
  const { user } = useUserStore();
  const [isOpen, setIsOpen] = useState(true);

  const { data: paidOnlineData, isLoading: loadingPaidOnline } =
    trpc.usersScore.getTotalScoreByActivityTypeAndUserId.useQuery({
      activityType: "paid_online_event",
    });
  const { data: freeOnlineData, isLoading: loadingFreeOnline } =
    trpc.usersScore.getTotalScoreByActivityTypeAndUserId.useQuery({
      activityType: "free_online_event",
    });
  const { data: paidOfflineData, isLoading: loadingPaidOfflineData } =
    trpc.usersScore.getTotalScoreByActivityTypeAndUserId.useQuery({
      activityType: "paid_offline_event",
    });
  const { data: freeOfflineData, isLoading: loadingFreeOffline } =
    trpc.usersScore.getTotalScoreByActivityTypeAndUserId.useQuery({
      activityType: "free_offline_event",
    });
  const { data: totalPoints, isLoading: loadingTotalPoints } = trpc.usersScore.getTotalScoreByUserId.useQuery();
  // Optionally, handle loading states here (e.g., show a spinner)
  if (!user) return null;
  if (loadingPaidOnline || loadingFreeOnline || loadingPaidOfflineData || loadingFreeOffline || loadingTotalPoints) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 1) Display the total points at the top */}
      <TotalPointsBox totalPoints={totalPoints ?? 0} />

      {/* 2) The accordion container */}
      <div className="bg-white rounded-md p-4">
        {/* Heading row with a toggle button on the right */}
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">Event Participation</h1>
          <button
            className="ml-2 text-gray-700"
            onClick={() => setIsOpen((prev) => !prev)}
          >
            <ChevronDownIconAccord isOpen={isOpen} />
          </button>
        </div>

        <p className="text-xs text-gray-500 mb-2">4 Tasks</p>

        {/* Slide-down area */}
        <div className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-[1000px]" : "max-h-0"}`}>
          <EventPointsGroup title="Online Events">
            <EventPointsCard
              eventTitle="Attend paid online events"
              tasksCount={paidOnlineData?.count ?? 0}
              description="10 Points"
              totalPoints={paidOnlineData?.total ?? 0}
            />
            <EventPointsCard
              eventTitle="Attend free online events"
              tasksCount={freeOnlineData?.count ?? 0}
              description="1 Points"
              totalPoints={freeOnlineData?.total ?? 0}
            />
          </EventPointsGroup>

          <EventPointsGroup title="In-Person Events">
            <EventPointsCard
              eventTitle="Attend paid in-person events"
              tasksCount={paidOfflineData?.count ?? 0}
              description="20 Points"
              totalPoints={paidOfflineData?.total ?? 0}
            />
            <EventPointsCard
              eventTitle="Attend free in-person events"
              tasksCount={freeOfflineData?.count ?? 0}
              description="10 Points"
              totalPoints={freeOfflineData?.total ?? 0}
            />
          </EventPointsGroup>
        </div>
      </div>
    </div>
  );
}
