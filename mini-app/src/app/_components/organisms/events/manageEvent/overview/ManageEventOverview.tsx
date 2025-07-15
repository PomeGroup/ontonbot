"use client";

import { useEventOverview } from "@/app/events/[hash]/overview/overview.context";
import ManageEventCard from "../ManageEventCard";

export const ManageEventOverview = () => {
  const { eventData } = useEventOverview();

  return (
    <div className="p-4">
      <ManageEventCard title="Overview">{eventData?.title}</ManageEventCard>
    </div>
  );
};
