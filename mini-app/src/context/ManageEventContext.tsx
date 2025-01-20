"use client";

import React, { createContext, useContext } from "react";
import { useGetEvent } from "@/hooks/events.hooks";

/**
 * We'll store the loaded event data in this context, so sub-routes can read it.
 * If you want the possibility of "null" for new event, you can adjust it:
 *   eventData: ReturnType<typeof useGetEvent>["data"] | null
 */
export interface ManageEventContextValue {
  eventData: ReturnType<typeof useGetEvent>["data"];
}

/**
 * The actual React Context
 */
export const ManageEventContext = createContext<ManageEventContextValue | null>(null);

/**
 * Hook to read from ManageEventContext
 */
export function useManageEventContext() {
  const ctx = useContext(ManageEventContext);
  if (!ctx) {
    throw new Error("useManageEventContext must be used within ManageEventContextProvider");
  }
  return ctx;
}

/**
 * A Provider to wrap your children in a <ManageEventContext.Provider value={...} />
 */
export function ManageEventContextProvider({
                                             value,
                                             children,
                                           }: {
  value: ManageEventContextValue;
  children: React.ReactNode;
}) {
  return (
    <ManageEventContext.Provider value={value}>
      {children}
    </ManageEventContext.Provider>
  );
}
