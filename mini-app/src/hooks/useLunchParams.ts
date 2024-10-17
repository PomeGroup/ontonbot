import { useMemo } from "react";
import { retrieveLaunchParams } from "@telegram-apps/sdk";

export function useLaunchParams() {
  return useMemo(() => {
    return typeof window === "undefined" ? null : retrieveLaunchParams();
  }, []);
}
