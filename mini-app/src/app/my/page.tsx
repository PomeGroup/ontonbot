"use client";
import { Button, Card } from "konsta/react";
import ticketIcon from "@/app/_components/icons/ticket.svg";
import calendarStarIcon from "./calendar-star.svg";
import Image from "next/image";
import Typography from "../../components/Typography";
import { ArrowRight } from "lucide-react";
import BottomNavigation from "../_components/BottomNavigation";
import tonIcon from "@/components/icons/ton.svg";
import { useEffect, useState } from "react";
import { cn } from "@/utils";
import { useTonAddress, useTonConnectModal } from "@tonconnect/ui-react";
import { trpc } from "../_trpc/client";
import { useUserStore } from "@/context/store/user.store";
import arrowDownIcon from "@/components/icons/arrow-down.svg";
import { toast } from "sonner";
import OntonDialog from "@/components/OntonDialog";
import PaymentCard from "./PaymentCard";
import { useRouter } from "next/navigation";
import { Channel } from "@/types";

const data = {
  id: 15,
  avatar: "/sq.jpg",
  title: "TON Network",
  eventCount: 223,
};

export default function ProfilePage() {
  const { user } = useUserStore();
  const hasWallet = !!user?.wallet_address;

  const [paid, setPaid] = useState(true);

  const router = useRouter();

  return (
    <div className="bg-[#EFEFF4] py-4">
      {paid ? <InlineChannelCard data={data} /> : <OrganizerProgress step={hasWallet ? 2 : 1} />}
      <Card>
        <div className="flex gap-3 align-stretch">
          <div className="bg-[#efeff4] p-4 rounded-lg">
            <Image
              src={ticketIcon}
              width={48}
              height={48}
              alt="ticket icon"
            />
          </div>
          <div className="flex flex-col flex-1">
            <Typography
              bold
              variant="title3"
            >
              Participated
            </Typography>
            <Typography variant="body">Your Activity</Typography>
            <Typography
              variant="caption1"
              className="mt-auto flex gap-4"
            >
              <div>
                <b>{data.eventCount}</b> Events
              </div>
              <div>
                <b>{data.eventCount}</b> SBTs
              </div>
            </Typography>
          </div>
          <div className="self-center">
            <ArrowRight className="text-main-button-color" />
          </div>
        </div>
      </Card>
      <Card>
        <div className="flex gap-3 align-stretch">
          <div className="bg-[#efeff4] p-4 rounded-lg">
            <Image
              src={calendarStarIcon}
              width={48}
              height={48}
              alt="Calendar icon"
            />
          </div>
          <div className="flex flex-col flex-1">
            <Typography
              bold
              variant="title3"
            >
              Hosted
            </Typography>
            <Typography variant="body">You Created</Typography>
            <Typography
              variant="caption1"
              className="mt-auto"
            >
              Become an organizer first
            </Typography>
          </div>
          <div className="self-center">
            <ArrowRight className="text-main-button-color" />
          </div>
        </div>
      </Card>
      <ConnectWalletCard />
      {hasWallet && !paid && (
        <PaymentCard
          onPayFinished={() => {
            setPaid(true);
          }}
        />
      )}
      {paid && (
        <Button
          className="py-6 mb-12 max-w-[calc(100%-2rem)] mx-auto"
          onClick={() => {
            router.push("/events/create");
          }}
        >
          Create New Event
        </Button>
      )}
      <BottomNavigation active="My ONTON" />
    </div>
  );
}

function InlineChannelCard({ data }: { data: Channel }) {
  const router = useRouter();

  return (
    <Card
      onClick={() => {
        router.push(`/my/edit`);
      }}
    >
      <div className="flex gap-3">
        <Image
          className="rounded-lg"
          src={data.avatar}
          width={80}
          height={80}
          alt="Avatar"
        />
        <div className="flex flex-col flex-1">
          <Typography
            variant="title3"
            bold
          >
            {data.title}
          </Typography>
          <Typography variant="subheadline2">Edit your information</Typography>
        </div>
        <div className="self-center">
          <ArrowRight className="text-main-button-color" />
        </div>
      </div>
    </Card>
  );
}

function OrganizerProgress({ step }: { step: 1 | 2 }) {
  return (
    <Card className="border border-[#007AFF]">
      <Typography
        bold
        variant="headline"
        className="mb-1"
      >
        Early Organizer Access
      </Typography>
      <Typography
        variant="subheadline1"
        className="text-[#575757] font-medium mb-3"
      >
        Subscribe as an organizer to create your own channel, publish events and let everyone know you and easily attend your
        events.
        <br />
        <b>{step === 1 ? "1. Connect your wallet." : "2. Pay subscription"}</b>
      </Typography>
      <div className="flex h-[2px] align-stretch gap-3">
        <div className="flex-1 bg-[#007AFF]" />
        <div className={cn("flex-1", step === 1 ? "bg-[#EEEEF0]" : "bg-[#007AFF]")} />
      </div>
    </Card>
  );
}

function ConnectWalletCard() {
  const [isOpen, setOpen] = useState(false);
  const { user } = useUserStore();

  const hasWallet = !!user?.wallet_address;
  return (
    <Card>
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
        <WalletDropdown />
      ) : (
        <Button
          className="py-5 rounded-lg"
          onClick={() => setOpen(true)}
        >
          <Image
            className="mr-1"
            src={tonIcon}
            alt=""
            width={15}
            height={15}
          />
          Connect your Wallet
        </Button>
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
    },
  });

  const { user } = useUserStore();

  useEffect(() => {
    if (!user?.user_id) return;

    if (!user?.wallet_address && tonWalletAddress) {
      toast.success("Your wallet is now connected");
      addWalletMutation.mutate({
        wallet: tonWalletAddress,
      });
    }
  }, [tonWalletAddress, user?.wallet_address]);

  return (
    <OntonDialog
      open={open}
      onClose={onClose}
      title="Your wallet is not connected"
    >
      <Typography
        variant="footnote"
        className="text-[#8E8E93] text-center mb-6 font-normal"
      >
        You are becoming a precious organizer of ONTON. In order to do so, you need to pay 10 TON and create your channel and
        your first Event afterwards.
      </Typography>
      <Button
        className="py-6 rounded-lg mb-3"
        onClick={handleConnect}
      >
        Connect Wallet
      </Button>
      <Button
        className="py-6 rounded-lg"
        outline
        onClick={onClose}
      >
        Maybe Later
      </Button>
    </OntonDialog>
  );
}

function WalletDropdown() {
  const [popoverOpened, setPopoverOpened] = useState(false);
  const { user } = useUserStore();

  const openPopover = () => {
    setPopoverOpened(true);
  };

  return (
    <>
      <div
        className="wallet-dropdown p-4 rounded-lg bg-[#EEEEF0] flex"
        onClick={() => openPopover()}
      >
        <Typography
          variant="body"
          className="text-ellipsis overflow-hidden"
        >
          {user?.wallet_address}
        </Typography>
        <Image
          src={arrowDownIcon}
          width={10}
          height={5}
          alt=""
        />
      </div>
    </>
  );
}
