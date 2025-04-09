"use client";
import CustomButton from "@/app/_components/Button/CustomButton";
import { trpc } from "@/app/_trpc/client";
import OntonDialog from "@/components/OntonDialog";
import Typography from "@/components/Typography";
import tonIcon from "@/components/icons/ton.svg";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useUserStore } from "@/context/store/user.store";
import { formatWalletAddress } from "@/server/utils/wallets-data";
import { useTonAddress, useTonConnectModal, useTonConnectUI, useTonWallet } from "@tonconnect/ui-react";
import { Button, Card } from "konsta/react";
import { ChevronDownIcon } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { IoExitOutline } from "react-icons/io5";
import { toast } from "sonner";

export function ConnectWalletCard() {
  const [isOpen, setOpen] = useState(false);

  const [tonconnect] = useTonConnectUI();

  const tonWallet = useTonWallet();
  const hasWallet = Boolean(tonWallet?.account.address);

  return (
    <Card className="w-full !mx-0">
      <Typography
        bold
        variant="headline"
        className="mb-4"
      >
        Your Wallet
      </Typography>

      <ConfirmConnectDialog
        open={isOpen}
        onClose={() => setOpen(false)}
      />

      {hasWallet ? (
        <DropdownMenu>
          <DropdownMenuTrigger className="w-full">
            <CustomButton
              variant="ghost"
              icon={<ChevronDownIcon />}
              className="w-full flex-row-reverse justify-between p-4"
            >
              {formatWalletAddress(tonWallet?.account.address!)}
            </CustomButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-full">
            <DropdownMenuItem
              onClick={() => {
                tonconnect.disconnect();
                toast.success("Wallet disconnected");
              }}
              className="cursor-pointer"
            >
              <IoExitOutline />
              Disconnect wallet
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <CustomButton
          variant="primary"
          onClick={() => setOpen(true)}
          icon={
            <Image
              className="mr-1"
              src={tonIcon}
              alt=""
              width={15}
              height={15}
            />
          }
        >
          Connect your Wallet
        </CustomButton>
      )}
    </Card>
  );
}

function ConfirmConnectDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const walletModal = useTonConnectModal();
  const tonWalletAddress = useTonAddress();

  const handleConnect = () => {
    walletModal.open();
  };

  const trpcUtils = trpc.useUtils();

  const addWalletMutation = trpc.users.addWallet.useMutation({
    onSuccess: () => {
      // trpcUtils.users.getVisitorReward.invalidate({}, { refetchType: "all" });
      trpcUtils.users.getWallet.invalidate({}, { refetchType: "all" });
      trpcUtils.users.syncUser.invalidate(undefined, { refetchType: "all" });
      onClose();
    },
  });

  const { user } = useUserStore();

  useEffect(() => {
    if (!user?.user_id) return;

    if (tonWalletAddress) {
      onClose();
    }

    if (!user?.wallet_address && tonWalletAddress) {
      toast.success("Your wallet is now connected");
      addWalletMutation.mutate({
        wallet: tonWalletAddress,
      });
    }
  }, [addWalletMutation, onClose, tonWalletAddress, user?.user_id, user?.wallet_address]);

  return (
    <OntonDialog
      open={open}
      onClose={onClose}
      title="Connect your wallet"
    >
      <Typography
        variant="body"
        className="text-center mb-6 font-normal"
      >
        <b>You are becoming an ONTON organizer.</b>
        <br />
        To create a channel and use special event publishing features, you need to pay 10 TON
      </Typography>
      <Button
        className="py-6 rounded-[10px] mb-3"
        onClick={handleConnect}
      >
        Connect Wallet
      </Button>
      <Button
        className="py-6 rounded-[10px]"
        outline
        onClick={onClose}
      >
        Maybe Later
      </Button>
    </OntonDialog>
  );
}
