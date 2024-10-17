"use client";

import { TonConnectButton } from "@tonconnect/ui-react";

const WalletButton = () => {
  return (
    <div className="flex  w-full flex-col items-center justify-center">
      <h2 className={"type-title-3 font-bold text-center mb-1"}>Your Wallet</h2>
      <TonConnectButton />
    </div>
  );
};

export default WalletButton;
