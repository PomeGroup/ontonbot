"use client";
import React, { useEffect, useRef, useState } from "react";
import useWebApp from "@/hooks/useWebApp";
import EventsSkeleton from "./molecules/skeletons/EventsSkeleton";
import { useUserStore } from "@/context/store/user.store";
import * as Sentry from "@sentry/nextjs";
import { useRouter, usePathname } from "next/navigation";
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

  console.log("webAppProvider: 24");
  // 1) Initialize
  useEffect(() => {
    console.log("webAppProvider: 26", webApp?.initDataUnsafe, webApp?.initData, isInitialized);
    debugger;
    if (webApp?.initData && !isInitialized) {
      console.log("webAppProvider: 29", webApp.initData);
      setInitData(webApp.initDataUnsafe);
      Sentry.init({ environment: process.env.NEXT_PUBLIC_ENV });
      Sentry.setUser({
        id: webApp.initDataUnsafe.user?.id,
        username: webApp.initDataUnsafe.user?.username,
      });
      setIsInitialized(true);
    }
    console.log("webAppProvider 38");
  }, [webApp?.initData, isInitialized, setInitData]);

  // --------------------------------
  const initialHistoryLength = useRef<number>(0);
  useEffect(() => {
    console.log("webAppProvider 44");
    if (typeof window !== "undefined") {
      console.log("webAppProvider 46");
      initialHistoryLength.current = window.history.length;
      console.log("Initial history length:", initialHistoryLength.current);
    }
  }, []);
  // 2) Reset history on (re)load if desired
  useEffect(() => {
    console.log("webAppProvider 53");
    // Option A: Always do it
    if (typeof window !== "undefined") {
      console.log("webAppProvider 56");
      window.history.replaceState(null, "", window.location.pathname);
    }
    console.log("webAppProvider 59");
  }, []);

  // 3) Global Back Button
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
      console.log("window.history.length", window.history.length, initialHistoryLength);

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
