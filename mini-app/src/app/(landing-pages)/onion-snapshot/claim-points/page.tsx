"use client";

import { useTonWallet } from "@tonconnect/ui-react";
import { ConnectNewWalletCard, OnionStockBanner, SnapshotResultCard } from "./_components";
import { OnionFollowUsCard } from "./_components/OnionFollowUsCard";

export default function ClaimPointsPage() {
  const wallet = useTonWallet();
  return (
    <div className="flex flex-col gap-4 py-6 px-4">
      <OnionStockBanner />
      <SnapshotResultCard />
      {wallet?.account.address ? <OnionFollowUsCard /> : <ConnectNewWalletCard buttonText="Connect Wallet" />}
    </div>
  );
}
