"use client";

import { useState } from "react";
import { useUserStore } from "@/context/store/user.store";
import BottomNavigation from "@/components/BottomNavigation";
import TotalPointsBox from "@/app/my/points/TotalPointsBox";

// Your newly created components
import EventPointsGroup from "./EventPointsGroup";
import EventPointsCard from "./EventPointsCard";

// A simple chevron-down icon (you can swap with a dedicated icon library)
function ChevronDownIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg
      className={`h-5 w-5 transition-transform duration-300 ${isOpen ? "transform rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M19 9l-7 7-7-7"
      />
    </svg>
  );
}

export default function MyPointsPage() {
  const { user } = useUserStore();
  const [isOpen, setIsOpen] = useState(true); // controls accordion open/close

  if (!user) return null;

  return (
    <div className="bg-[#EFEFF4] min-h-screen overflow-y-auto mb-[40px]">
      {/* 1) Display the total points at the top */}
      <div className="p-4">
        <TotalPointsBox totalPoints={220} />
      </div>

      {/* 2) The accordion container */}
      <div className="mx-4 bg-white rounded-md p-4">
        {/* Heading row with a toggle button on the right */}
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">Event Participation</h1>
          <button
            className="ml-2 text-gray-700"
            onClick={() => setIsOpen((prev) => !prev)}
          >
            <ChevronDownIcon isOpen={isOpen} />
          </button>
        </div>

        <p className="text-xs text-gray-500 mb-2">3 Tasks</p>

        {/* Slide-down area.
            max-h-0 => fully collapsed,
            max-h-[1000px] => “enough” space to show the content.
            Feel free to adjust for your expected content size. */}
        <div className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-[1000px]" : "max-h-0"}`}>
          {/* Now, render your EventPointsGroup items inside the collapsible area */}

          <EventPointsGroup title="Online Events">
            <EventPointsCard
              eventTitle="Attend paid online events"
              tasksCount={3}
              description="10 Points + 1 Point per USDT price"
              totalPoints={112}
            />
            <EventPointsCard
              eventTitle="Attend free online events"
              tasksCount={2}
              description="2 Points"
              totalPoints={4}
            />
          </EventPointsGroup>

          <EventPointsGroup title="Offline Events">
            <EventPointsCard
              eventTitle="Attend offline events"
              tasksCount={5}
              description="10 Points + 1 Point per USDT price"
              totalPoints={232}
            />
          </EventPointsGroup>
        </div>
      </div>

      {/* 3) Bottom navigation */}
      <BottomNavigation active="My ONTON" />
    </div>
  );
}
