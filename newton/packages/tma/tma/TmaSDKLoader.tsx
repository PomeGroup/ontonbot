"use client";

import { useEffect, type PropsWithChildren } from "react";
import { SDKProvider, useViewport } from "@tma.js/sdk-react";

import "./hooks";

import { useLaunchParams } from "./hooks";

/**
 * Root component of the whole project.
 */
export function TmaSDKLoader({ children }: PropsWithChildren) {
  return (
    <SDKProvider
      acceptCustomStyles
      debug={process.env.NODE_ENV === "development"}
    >
      {children}
      <TMAInitSettings />
    </SDKProvider>
  );
}

function TMAInitSettings() {
  const tma = useViewport(true);
  const launchParams = useLaunchParams();

  useEffect(() => {
    if (
      launchParams?.platform === "ios" ||
      launchParams?.platform === "macos"
    ) {
      document.documentElement.classList.add("use-system-font");
    }
  }, [launchParams?.platform]);

  useEffect(() => {
    tma?.expand();
  }, [tma]);

  return <></>;
}
