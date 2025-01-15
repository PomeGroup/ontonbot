"use client";
import { Button, Card } from "konsta/react";
import ticketIcon from "@/app/_components/icons/ticket.svg";
import calendarStarIcon from "./calendar-star.svg";
import Image from "next/image";
import Typography from "../../components/Typography";
import { ArrowRight } from "lucide-react";
import BottomNavigation from "../../components/BottomNavigation";
import tonIcon from "@/components/icons/ton.svg";
import { useEffect, useState } from "react";
import { cn } from "@/utils";
import { TonConnectButton, useTonAddress, useTonConnectModal } from "@tonconnect/ui-react";
import { trpc } from "../_trpc/client";
import { useUserStore } from "@/context/store/user.store";
import { toast } from "sonner";
import OntonDialog from "@/components/OntonDialog";
import PaymentCard from "./PaymentCard";
import { useRouter } from "next/navigation";
import { Channel } from "@/types";
import channelAvatar from "@/components/icons/channel-avatar.svg";
import Link from "next/link";

export default function ProfilePage() {
  const { user } = useUserStore();
  const hasWallet = !!user?.wallet_address;

  const [paid, setPaid] = useState(true);
  const { data, error, isLoading } = trpc.organizers.getOrganizer.useQuery({});

  useEffect(() => {
    const notOrganizer = error?.message?.includes("not found");
    if (!notOrganizer) return;
    setPaid(false);
  }, [error]);

  const router = useRouter();

  if (isLoading) return "loading";
  return (
    <div className="bg-[#EFEFF4] pt-4 pb-4 min-h-screen">
      {paid && data ? <InlineChannelCard data={data} /> : <OrganizerProgress step={hasWallet ? 2 : 1} />}
      <Link
        className="my-3 py-2 text-center block"
        href={`/channels/${data?.user_id}/`}
      >
        My Public Page
      </Link>
      <Card onClick={() => router.push("/my/participated/")}>
        <div className="flex gap-3 align-stretch">
          <div className="bg-[#efeff4] p-4 rounded-[10px]">
            <Image
              src={ticketIcon}
              width={48}
              height={48}
              alt="ticket icon"
            />
          </div>
          <div className="flex flex-col flex-1 gap-1">
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
                <b>{data?.participated_event_count || "0"}</b> Events
              </div>
              {/* <div>
                <b>{data.sbt_count || "0"}</b> SBTs
              </div> */}
            </Typography>
          </div>
          <div className="self-center">
            <ArrowRight className="text-main-button-color" />
          </div>
        </div>
      </Card>
      <Card onClick={() => {
	      if (!paid) {
		      toast.error('Only organizers can host events');
		      return
	      }
	      router.push("/my/hosted/")
      }}>
        <div className="flex gap-3 align-stretch">
          <div className="bg-[#efeff4] p-4 rounded-[10px]">
            <Image
              src={calendarStarIcon}
              width={48}
              height={48}
              alt="Calendar icon"
            />
          </div>
          <div className="flex flex-col flex-1 gap-1">
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
              {paid ? (
                <>
                  <b>{data?.hosted_event_count || "0"}</b> Events
                </>
              ) : (
                "Become an organizer first"
              )}
            </Typography>
          </div>
          <div className="self-center">
            <ArrowRight className="text-main-button-color" />
          </div>
        </div>
      </Card>
      <ConnectWalletCard />
      <PaymentCard
        visible={hasWallet && !paid}
        onPayFinished={() => {
          setPaid(true);
        }}
      />

      {paid && (
        <Button
          className="py-6 mb-12 max-w-[calc(100%-2rem)] mx-auto rounded-[10px]"
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
        {data.org_image || data.photo_url ? (
          <Image
            className="rounded-[10px]"
            src={data.org_image || data.photo_url || ""}
            width={80}
            height={80}
            alt="Avatar"
          />
        ) : (
          <div className="bg-[#EFEFF4] rounded-md p-1">
            <Image
              className="rounded-md"
              src={channelAvatar}
              width={72}
              height={72}
              alt={data.org_channel_name || ""}
            />
          </div>
        )}
        <div className="flex flex-col flex-1 gap-1 overflow-hidden">
          <Typography
            variant="title3"
            bold
            className="text-ellipsis whitespace-nowrap overflow-hidden"
          >
            {data.org_channel_name ?? "No Title"}
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
        <TonConnectButton className="mx-auto" />
      ) : (
        <Button
          className="py-6 rounded-[10px]"
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
