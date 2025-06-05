"use client";

import { useTonWallet } from "@tonconnect/ui-react";
import { ConnectNewWalletCard, OnionBenefitsCard, OnionStockBanner, SnapshotResultCard } from "./_components";

export default function ClaimPointsPage() {
  const wallet = useTonWallet();
  return (
    <div className="flex flex-col gap-4 py-6 px-4">
      <OnionStockBanner />
      <SnapshotResultCard />
      {wallet?.account.address ? <OnionBenefitsCard /> : <ConnectNewWalletCard buttonText="Connect Wallet" />}
    </div>
  );
}
