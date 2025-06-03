"use client";

import { ClaimPointsProvider } from "./ClaimPointsContext";

export default function ClaimPointsLayout({ children }: { children: React.ReactNode }) {
  return <ClaimPointsProvider>{children}</ClaimPointsProvider>;
}
