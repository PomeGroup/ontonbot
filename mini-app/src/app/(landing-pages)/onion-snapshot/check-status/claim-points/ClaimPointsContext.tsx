"use client";

import { createContext, useContext, useState } from "react";

export const ClaimPointsContext = createContext({
  isClaimed: false,
  setIsClaimed: (isClaimed: boolean) => {},
  setPoints: (points: { nfts: null; referrals: null; event_creation: null; event_participation: null }) => {},
  points: {
    nfts: null,
    referrals: null,
    event_creation: null,
    event_participation: null,
  },
});

export const useClaimPoints = () => {
  return useContext(ClaimPointsContext);
};

export const ClaimPointsProvider = ({ children }: { children: React.ReactNode }) => {
  const [isClaimed, setIsClaimed] = useState(false);
  const [points, setPoints] = useState({
    nfts: null,
    referrals: null,
    event_creation: null,
    event_participation: null,
  });

  return (
    <ClaimPointsContext.Provider value={{ isClaimed, setIsClaimed, points, setPoints }}>
      {children}
    </ClaimPointsContext.Provider>
  );
};
