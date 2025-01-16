"use client";
import useWebApp from "@/hooks/useWebApp";
import EventsSkeleton from "./molecules/skeletons/EventsSkeleton";
import * as Sentry from "@sentry/nextjs";
import React, { useEffect, useRef, useState } from "react";
import { useUserStore } from "@/context/store/user.store";
import { usePathname, useRouter } from "next/navigation";
import { useCreateEventStore } from "@/zustand/createEventStore";

const WebAppProvider = ({ children }: { children: React.ReactNode }) => {
  const webApp = useWebApp();
  const { setInitData, initData } = useUserStore();
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const { currentStep, setCurrentStep, resetState } = useCreateEventStore((state) => ({
    currentStep: state.currentStep,
    setCurrentStep: state.setCurrentStep,
    resetState: state.resetState,
  }));
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
   const initialHistoryLength = useRef<number>(0);
  useEffect(() => {
    if (typeof window !== "undefined" && window?.history) {
      initialHistoryLength.current = window.history?.length || 0;
      //window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !window.Telegram?.WebApp) return;
    if (!isInitialized) return;

    const WebApp = window.Telegram.WebApp;
    const backButton = WebApp.BackButton;

    console.log("pathname", pathname);
    if (pathname === "/") {
      backButton.hide();
    } else {
      backButton.show();
    }
    const handleBackButtonClicked = () => {


      const isCreateRoute = pathname?.startsWith("/events/create");
      const isEditRoute = /^\/events\/[^/]+\/edit$/.test(pathname ?? "");

      if (isCreateRoute || isEditRoute) {
        // Step-based page
        if (currentStep > 1) {
          setCurrentStep(currentStep - 1);
        } else {
          // Step is 1 => user wants to exit
          router.back();
        }
      } else {
        // Normal fallback
        if (window.history.length === initialHistoryLength.current) {
          router.push("/");
        } else if (window.history.length > 1) {
          router.back();
        } else {
          router.push("/");
        }
      }
    };

    WebApp.onEvent("backButtonClicked", handleBackButtonClicked);

    // Cleanup
    return () => {
      WebApp.offEvent("backButtonClicked", handleBackButtonClicked);
      backButton.hide();
    };
  }, [router, pathname, isInitialized, currentStep, setCurrentStep, resetState]);

  if (!initData) {
    return <EventsSkeleton />;
  }

  return <>{children}</>;
};

export default WebAppProvider;
