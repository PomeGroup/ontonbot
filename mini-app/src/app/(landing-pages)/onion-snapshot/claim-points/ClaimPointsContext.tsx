"use client";

import { trpc } from "@/app/_trpc/client";
import { type WalletSummary } from "@/db/modules/claimOnion.db";
import { useTonWallet } from "@tonconnect/ui-react";
import { createContext, useContext, useState } from "react";
import WalletNotConnected from "../_components/WalletNotConnected";

type ContextType = {
  wallets: null | WalletSummary[];
  /** Controls whether to show wallet provider when wallet is disconnected */
  openConnect: boolean;
  /** Updates the wallet provider visibility state when disconnected */
  setOpenConnect: (open: boolean) => void;
};

export const ClaimPointsContext = createContext<ContextType>({
  wallets: null,
  openConnect: false,
  setOpenConnect: (open) => {},
});

export const useClaimPointsContext = () => {
  return useContext(ClaimPointsContext);
};

export const ClaimPointsProvider = ({ children }: { children: React.ReactNode }) => {
  const [openConnect, setOpenConnect] = useState(false);
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
    <ClaimPointsContext.Provider value={{ wallets: claimOverview.data ?? null, openConnect, setOpenConnect }}>
      <WalletNotConnected
        openOnDisconnect={openConnect}
        setOpenOnDiconnect={setOpenConnect}
      >
        {children}
      </WalletNotConnected>
    </ClaimPointsContext.Provider>
  );
};
