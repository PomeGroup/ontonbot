"use client";

import { useLaunchParams } from "@/hooks/useLunchParams";
import { useEffect } from "react";
import { platformSwitch } from "../tma/utils/platformSwitch";

const DocumentPlatformProvider = () => {
  const launchParams = useLaunchParams();

  useEffect(() => {
    platformSwitch(launchParams?.platform, {
      ios: () => document.documentElement.classList.add("platform-ios"),
      android: () => document.documentElement.classList.add("platform-android"),
    });
  }, [launchParams?.platform]);

  return null;
};

export default DocumentPlatformProvider;
