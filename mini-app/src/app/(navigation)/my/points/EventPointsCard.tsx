"use client";
import { Badge } from "@/components/ui/badge";

interface EventPointsCardProps {
  eventTitle: string; // e.g. "Attend paid online events"
  tasksCount: number; // e.g. 3
  description: string; // e.g. "10 Points + 1 Point per USDT price"
  totalPoints: number; // e.g. 112
}

export default function EventPointsCard({ eventTitle, tasksCount, description, totalPoints }: EventPointsCardProps) {
  return (
    <div className="border rounded-md p-3 mb-3">
      <div className="flex justify-between items-center">
        {/* Event title and tasks (e.g. "Attend paid online events x3") */}
        <div className="text-sm font-medium">
          {eventTitle}
          {/* <span className="text-xs font-normal text-gray-500">x{tasksCount}</span> */}
        </div>

        {/* Black circle showing total points (right side) */}
        <Badge variant="ontonDark">{totalPoints}</Badge>
      </div>

      {/* Secondary description line (e.g. "10 Points + 1 Point per USDT price") */}
      <p className="text-xs text-gray-600 mt-1">{description}</p>
    </div>
  );
}
