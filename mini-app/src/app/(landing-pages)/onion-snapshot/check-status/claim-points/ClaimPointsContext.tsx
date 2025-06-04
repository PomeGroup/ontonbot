"use client";

import { trpc } from "@/app/_trpc/client";
import { type WalletSummary } from "@/db/modules/claimOnion.db";
import { useTonWallet } from "@tonconnect/ui-react";
import { createContext, useContext } from "react";

type ContextType = {
  wallets: null | WalletSummary[];
};

export const ClaimPointsContext = createContext<ContextType>({
  wallets: null,
});

export const useClaimPointsContext = () => {
  return useContext(ClaimPointsContext);
};

export const ClaimPointsProvider = ({ children }: { children: React.ReactNode }) => {
  const wallet = useTonWallet();

  const claimOverview = trpc.campaign.getClaimOverview.useQuery(
    {
      walletAddress: wallet?.account.address!,
      tonProof: "0x0000000000000000000000000000000000000000",
    },
    {
      queryKey: ["campaign.getClaimOverview", { walletAddress: wallet?.account.address! }],
      enabled: !!wallet?.account.address,
    }
  );

  return (
    <ClaimPointsContext.Provider value={{ wallets: claimOverview.data ?? null }}>{children}</ClaimPointsContext.Provider>
  );
};
