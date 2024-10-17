"use client";
import useWebApp from "@/hooks/useWebApp";
import EventsSkeleton from "./molecules/skeletons/EventsSkeleton";
import React from "react";

const WebAppProvider = ({ children }: { children: React.ReactNode }) => {
  const webApp = useWebApp();

  if (!webApp) {
    return <EventsSkeleton />;
  }

  return <>{children}</>;
};

export default WebAppProvider;
