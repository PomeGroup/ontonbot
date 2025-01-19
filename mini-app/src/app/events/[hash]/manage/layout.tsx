"use client";

import React, { createContext, useContext } from "react";
import { useParams } from "next/navigation";

import useAuth from "@/hooks/useAuth";
import { useGetEvent } from "@/hooks/events.hooks";
import EventsSkeleton from "@/app/_components/molecules/skeletons/EventsSkeleton";

/**
 * We'll store the loaded event data in this context,
 * so child routes can read it without re-fetching.
 */
interface ManageEventContextValue {
  eventData: NonNullable<ReturnType<typeof useGetEvent>["data"]>;
}
const ManageEventContext = createContext<ManageEventContextValue | null>(null);

export function useManageEventContext() {
  const ctx = useContext(ManageEventContext);
  if (!ctx) {
    throw new Error("useManageEventContext must be used inside [hash]/manage/layout.tsx");
  }
  return ctx;
}

/**
 * The layout for /events/[hash]/manage/*.
 * - Checks auth
 * - Loads event
 * - If error or not authorized => show message
 * - Otherwise => provide eventData to children routes
 */
export default function Layout({ children }: { children: React.ReactNode }) {
  const { hash } = useParams() as { hash: string };
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
  // 3) If there's an error loading event
  if (event.error) {
    return <div>Error: {event.error.message}</div>;
  }
  // 4) If event data is still loading
  if (!event.data ) {
    return <div>Loading event data...</div>;
  }

  // 5) We have event data + authorized => pass via context
  return (
    <ManageEventContext.Provider value={{ eventData: event.data }}>
      {children}
    </ManageEventContext.Provider>
  );
}
