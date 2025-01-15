"use client";
import React, { useEffect, useState, useRef } from "react";
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

  const { currentStep, setCurrentStep, resetState } = useCreateEventStore(
    (state) => ({
      currentStep: state.currentStep,
      setCurrentStep: state.setCurrentStep,
      resetState: state.resetState,
    })
  );

  // --------------------------------
  // 1) Initialize Sentry & user info
  // --------------------------------
  useEffect(() => {
    if (webApp?.initData && webApp?.initDataUnsafe && !isInitialized) {
      setInitData(webApp.initData);
      Sentry.init({ environment: process.env.NEXT_PUBLIC_ENV });
      Sentry.setUser({
        id: webApp.initDataUnsafe.user?.id,
        username: webApp.initDataUnsafe.user?.username,
      });
      setIsInitialized(true);
    }
  }, [webApp, isInitialized, setInitData]);

  // --------------------------------
  // 2) (Optional) Replace the current state
  //    to prevent the user from going "back"
  //    within your own app session.
  // --------------------------------
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Overwrite the current entry so there's
      // no 'back' inside your current session.
      window.history.replaceState({}, "", window.location.href);
      resetState();
    }
  }, [resetState]);

  // --------------------------------
  // 3) Store the initial history length
  // --------------------------------
  const initialHistoryLength = useRef<number>(0);
  useEffect(() => {
    if (typeof window !== "undefined") {
      initialHistoryLength.current = window.history.length;
      console.log("Initial history length:", initialHistoryLength.current);
    }
  }, []);

  // --------------------------------
  // 4) Global Back Button Logic
  // --------------------------------
  useEffect(() => {
    if (typeof window === "undefined" || !window.Telegram?.WebApp) return;
    if (!isInitialized) return;

    const WebApp = window.Telegram.WebApp;
    const backButton = WebApp.BackButton;
    backButton.show();

    const handleBackButtonClicked = () => {
      console.log("Current history length:", window.history.length);
      console.log("Initial history length:", initialHistoryLength.current);

      const isCreateRoute = pathname?.startsWith("/events/create");
      const isEditRoute = /^\/events\/[^/]+\/edit$/.test(pathname ?? "");

      // 4a) If we are on a step-based route
      if (isCreateRoute || isEditRoute) {
        if (currentStep > 1) {
          setCurrentStep(currentStep - 1);
        } else {
          // Step is 1 => user wants to exit
          // Compare current vs. initial length
          if (window.history.length > initialHistoryLength.current) {
            router.back();
          } else {
            router.push("/");
          }
        }
      } else {
        // 4b) Normal fallback for non-step routes
        if (window.history.length > initialHistoryLength.current) {
          router.back();
        } else {
          router.push("/");
        }
      }
    };

    WebApp.onEvent("backButtonClicked", handleBackButtonClicked);

    return () => {
      WebApp.offEvent("backButtonClicked", handleBackButtonClicked);
      backButton.hide();
    };
  }, [router, pathname, isInitialized, currentStep, setCurrentStep, resetState]);

  // --------------------------------
  // 5) Render
  // --------------------------------
  if (!initData) {
    return <EventsSkeleton />;
  }

  return <>{children}</>;
};

export default WebAppProvider;
