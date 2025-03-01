"use client";
import React from "react";

interface EventPointsGroupProps {
  title: string;
  /** Any number of <EventPointsCard> children */
  children: React.ReactNode;
}

export default function EventPointsGroup({ title, children }: EventPointsGroupProps) {
  return (
    <div className="bg-white border rounded-lg p-4 mb-4 h-auto">
      {/* Group title, e.g. "Online Events" or "Offline Events" */}
      <h2 className="text-base font-semibold mb-2">{title}</h2>
      {/* Render EventPointsCard children here */}
      {children}
    </div>
  );
}
