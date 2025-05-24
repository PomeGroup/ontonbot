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
    trpc.usersScore.getTotalScoreByActivityTypesAndUserId.useQuery({
      activityTypes: ["paid_online_event"],
      itemType: "event",
    });
  const { data: freeOnlineData, isLoading: loadingFreeOnline } =
    trpc.usersScore.getTotalScoreByActivityTypesAndUserId.useQuery({
      activityTypes: ["free_online_event"],
      itemType: "event",
    });
  const { data: paidOfflineData, isLoading: loadingPaidOfflineData } =
    trpc.usersScore.getTotalScoreByActivityTypesAndUserId.useQuery({
      activityTypes: ["paid_offline_event"],
      itemType: "event",
    });
  const { data: freeOfflineData, isLoading: loadingFreeOffline } =
    trpc.usersScore.getTotalScoreByActivityTypesAndUserId.useQuery({
      activityTypes: ["free_offline_event"],
      itemType: "event",
    });
  const joinOntonAffiliateData = trpc.usersScore.getTotalScoreByActivityTypesAndUserId.useQuery({
    activityTypes: ["join_onton_affiliate"],
    itemType: "task",
  });
  const eventOrganizationData = trpc.usersScore.getTotalScoreByActivityTypesAndUserId.useQuery({
    activityTypes: ["paid_online_event", "paid_offline_event", "free_online_event", "free_offline_event"],
    itemType: "organize_event",
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
        <div
          className={`overflow-hidden flex flex-col gap-4 transition-all duration-300 ${isOpen ? "max-h-[1000px]" : "max-h-0"}`}
        >
          <EventPointsGroup title="Online Events">
            <EventPointsCard
              eventTitle="Attend paid online events"
              tasksCount={Number(paidOnlineData?.count ?? 0)}
              description="10 Points"
              totalPoints={Number(paidOnlineData?.total ?? 0)}
              type="paid_online_event"
            />
            <EventPointsCard
              eventTitle="Attend free online events"
              tasksCount={Number(freeOnlineData?.count ?? 0)}
              description="1 Points"
              totalPoints={Number(freeOnlineData?.total ?? 0)}
              type="free_online_event"
            />
          </EventPointsGroup>

          <EventPointsGroup title="In-Person Events">
            <EventPointsCard
              eventTitle="Attend paid in-person events"
              tasksCount={Number(paidOfflineData?.count ?? 0)}
              description="20 Points"
              totalPoints={Number(paidOfflineData?.total ?? 0)}
              type="paid_offline_event"
            />
            <EventPointsCard
              eventTitle="Attend free in-person events"
              tasksCount={Number(freeOfflineData?.count ?? 0)}
              description="10 Points"
              totalPoints={Number(freeOfflineData?.total ?? 0)}
              type="free_offline_event"
            />
          </EventPointsGroup>
          <EventPointsGroup title="Referals">
            <EventPointsCard
              eventTitle="Join ONTON Affiliate"
              tasksCount={Number(joinOntonAffiliateData?.data?.count ?? 0)}
              description="0.2 Points"
              totalPoints={Number(joinOntonAffiliateData?.data?.total ?? 0)}
              type="join_onton_affiliate"
            />
          </EventPointsGroup>
          <EventPointsGroup title="Organize Events">
            <EventPointsCard
              eventTitle="Organize events"
              tasksCount={Number(eventOrganizationData?.data?.count ?? 0)}
              description="10 Points"
              totalPoints={Number(eventOrganizationData?.data?.total ?? 0)}
            />
          </EventPointsGroup>
        </div>
      </div>
    </div>
  );
}
