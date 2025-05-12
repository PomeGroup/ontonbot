import Typography from "@/components/Typography";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useTonAddress, useTonConnectUI } from "@tonconnect/ui-react";
import { UnplugIcon } from "lucide-react";
import { FaAngleDown } from "react-icons/fa";

export const SnapshotConnectWallet = () => {
  const walletAddress = useTonAddress(true);
  const [tonModalUI] = useTonConnectUI();

  const connectWallet = () => {
    void tonModalUI.openModal();
  };

  const disconnectWallet = () => {
    void tonModalUI.disconnect();
  };

  if (!walletAddress) {
    return (
      <Button
        onClick={connectWallet}
        variant="primary-onion"
      >
        Connect Wallet
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex gap-5 font-medium p-3"
        >
          {`${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`}
          <FaAngleDown size={16} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        onClick={disconnectWallet}
        className="cursor-pointer rounded-2lg p-3 flex items-center gap-2 border border-solid border-brand-divider-dark text-black bg-red-500"
      >
        <UnplugIcon />
        <Typography
          variant="body"
          weight="medium"
        >
          Disconnect
        </Typography>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
