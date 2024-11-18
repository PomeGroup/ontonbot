import { useMemo } from "react";
import { retrieveLaunchParams } from "@tma.js/sdk";

export function useLaunchParams() {
  return useMemo(() => {
    return typeof window === "undefined" ? null : retrieveLaunchParams();
  }, []);
}
