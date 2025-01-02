"use client";
import useWebApp from "@/hooks/useWebApp";
import EventsSkeleton from "./molecules/skeletons/EventsSkeleton";
import * as Sentry from "@sentry/nextjs";
import React, { useEffect, useState } from "react";
import { useUserStore } from "@/context/store/user.store";

const WebAppProvider = ({ children }: { children: React.ReactNode }) => {
  const webApp = useWebApp();
  const { setInitData, initData } = useUserStore();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (webApp?.initData && webApp?.initDataUnsafe && !isInitialized) {
      setInitData(webApp.initData);
      Sentry.init({
        environment: process.env.NEXT_PUBLIC_ENV,
      });
      Sentry.setUser({
        id: webApp.initDataUnsafe.user?.id,
        username: webApp.initDataUnsafe.user?.username,
      });
      setIsInitialized(true);
    }
  }, [webApp?.initData, isInitialized]);

  if (!initData) {
    return <EventsSkeleton />;
  }

  return <>{children}</>;
};

export default WebAppProvider;
