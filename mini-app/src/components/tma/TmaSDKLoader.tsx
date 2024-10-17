"use client";

import { useEffect, type PropsWithChildren } from "react";
import { SDKProvider, useLaunchParams, useViewport } from "@telegram-apps/sdk-react";

/**
 * Root component of the whole project.
 */
export function TmaSDKLoader({ children }: PropsWithChildren) {
  return (
    <SDKProvider
      acceptCustomStyles
      debug={process.env.ENV === "development"}
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
