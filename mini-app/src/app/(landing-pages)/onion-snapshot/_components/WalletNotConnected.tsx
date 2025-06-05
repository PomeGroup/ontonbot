import Typography from "@/components/Typography";
import { Button } from "@/components/ui/button";
import { useTonConnectModal, useTonWallet } from "@tonconnect/ui-react";
import React, { useEffect } from "react";
import DataStatus from "../../../_components/molecules/alerts/DataStatus";

interface WalletNotConnectedProps {
  children: React.ReactNode;
  /** Controls whether to show wallet provider when wallet is disconnected */
  openOnDisconnect?: boolean;
  /** Updates the wallet provider visibility state when disconnected */
  setOpenOnDiconnect?: (open: boolean) => void;
}

const WalletNotConnected: React.FC<WalletNotConnectedProps> = ({ children, openOnDisconnect, setOpenOnDiconnect }) => {
  const tonConnectModal = useTonConnectModal();
  const tonConnectAddress = useTonWallet();

  useEffect(() => {
    if (tonConnectAddress?.account.address) {
      setOpenOnDiconnect?.(false);
    }
  }, [tonConnectAddress?.account.address]);

  if (
    // If the user has a connected wallet, show the children
    tonConnectAddress?.account.address || // OR
    // if wallet was not connect but the state on disconnect was open we show the children
    (!tonConnectAddress?.account.address && !openOnDisconnect)
  ) {
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
          Connect Wallet
        </Typography>
        <div className="flex flex-col gap-2">
          <Typography
            variant="subheadline2"
            className="text-center font-bold"
          >
            To check your ONIONs, connect your TON wallet.
          </Typography>
          <Typography
            variant="footnote"
            className="text-center font-normal"
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
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            tonConnectModal.open();
          }}
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
