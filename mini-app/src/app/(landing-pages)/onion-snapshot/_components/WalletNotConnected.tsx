import Typography from "@/components/Typography";
import { Button } from "@/components/ui/button";
import { useTonConnectModal, useTonWallet } from "@tonconnect/ui-react";
import React from "react";
import DataStatus from "../../../_components/molecules/alerts/DataStatus";

interface WalletNotConnectedProps {
  children: React.ReactNode;
}

const WalletNotConnected: React.FC<WalletNotConnectedProps> = ({ children }) => {
  const tonConnectModal = useTonConnectModal();
  const tonConnectAddress = useTonWallet();

  // If the user has a connected wallet, show the children
  if (tonConnectAddress?.account.address) {
    return <>{children}</>;
  }

  // Otherwise show the connect wallet UI
  return (
    <div className="px-8 py-10 flex flex-col items-center w-full mx-auto gap-6">
      <DataStatus
        status="not_found"
        size="lg"
      />
      <div className="flex flex-col gap-4">
        <Typography
          variant="title1"
          weight="bold"
          className="text-center text-zinc-900"
        >
          No connected wallet
        </Typography>
        <div className="flex flex-col gap-2">
          <Typography
            variant="subheadline2"
            className="text-center font-bold"
          >
            To check your ONION eligibility, connect your TON wallet.
          </Typography>
          <Typography
            variant="subheadline2"
            className="text-center font-bold"
          >
            This doesn&apos;t cost gas or give us access to your funds.
          </Typography>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={() => tonConnectModal.open()}
        >
          Connect Wallet
        </Button>
        <Typography
          variant="footnote"
          className="text-center"
        >
          The wallet address must be associated with a single unique TID. Once linked, you cannot unlink it or connect this
          wallet to a different TID.
        </Typography>
      </div>
    </div>
  );
};

export default WalletNotConnected;
