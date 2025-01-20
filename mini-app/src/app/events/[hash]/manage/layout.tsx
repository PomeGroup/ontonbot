"use client";

import React from "react";
import { useParams } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import { useGetEvent } from "@/hooks/events.hooks";
import EventsSkeleton from "@/app/_components/molecules/skeletons/EventsSkeleton";

// Import the context provider from the separate file:
import {
  ManageEventContextProvider,
  ManageEventContextValue,
} from "../../../../context/ManageEventContext";

/**
 * The layout for /events/[hash]/manage/*.
 * - Checks auth
 * - Loads event
 * - If error or not authorized => show message
 * - Otherwise => provide eventData to children routes
 */
export default function Layout({ children }: { children: React.ReactNode }) {
  const { hash } = useParams() as { hash?: string };
  const { authorized, isLoading } = useAuth();
  const event = useGetEvent(hash);
  // 1) If user is still loading
  if (isLoading) {
    return <EventsSkeleton />;
  }
  // 2) If user not authorized
  if (!authorized) {
    return <div>Not Authorized</div>;
  }

  // If you have a scenario for a "new" event with no real data:
  // if (hash === "new") {
  //   return (
  //     <ManageEventContextProvider value={{ eventData: null }}>
  //       {children}
  //     </ManageEventContextProvider>
  //   );
  // }

  if (!hash) {
    return <div>Missing event hash!</div>;
  }

  // 3) fetch the event

  if (event.error) {
    return <div>Error: {event.error.message}</div>;
  }
  if (!event.data) {
    return <div>Loading event data...</div>;
  }

  // 4) Provide the event data to children
  const ctxValue: ManageEventContextValue = {
    eventData: event.data,
  };

  return (
    <ManageEventContextProvider value={ctxValue}>
      {children}
    </ManageEventContextProvider>
  );
}
