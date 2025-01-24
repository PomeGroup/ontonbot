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
import ActionCard from "@/ActionCard";
import { useSectionStore } from "@/zustand/useSectionStore";
import LoadableImage from "@/components/LoadableImage";
import { isValidImageUrl } from "@/lib/isValidImageUrl";

export default function ProfilePage() {
  const { user } = useUserStore();
  const hasWallet = !!useTonAddress();
  const { setSection } = useSectionStore();
  const { data, isLoading } = trpc.organizers.getOrganizer.useQuery({});

  const paid = user?.role === "organizer" || user?.role === "admin";
  const router = useRouter();

  if (isLoading) return "loading";

  return (
    <div className="bg-[#EFEFF4] py-4 min-h-screen -mb-safe">
      {paid ? <InlineChannelCard data={data} /> : <OrganizerProgress step={hasWallet ? 2 : 1} />}
      <ActionCard
        onClick={() => router.push("/my/participated")}
        iconSrc={ticketIcon}
        title="Participated"
        subtitle="Your Activity"
        footerTexts={[
          {
            count: data?.participated_event_count || 0,
            items: "Events",
          },
        ]}
      />
      <ActionCard
        onClick={() => {
          if (!paid) {
            toast.error("Only organizers can host events");
            return;
          }
          router.push("/my/hosted/");
        }}
        iconSrc={calendarStarIcon}
        title="Hosted"
        subtitle="You Created"
        footerTexts={[
          paid ? { items: "Events", count: data?.hosted_event_count || 0 } : { items: "Become an organizer first" },
        ]}
      />

      <ConnectWalletCard />
      <PaymentCard visible={!paid && hasWallet} />

      {paid && (
        <Button
          className="-my-8 py-6 mb-12 max-w-[calc(100%-2rem)] mx-auto rounded-[10px]"
          onClick={() => {
            setSection("event_setup_form_general_step");
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

function InlineChannelCard({ data }: { data: Channel | undefined }) {
  const router = useRouter();

  if (!data) return null;
  return (
    <Card
      className='mt-0 cursor-pointer'
      onClick={() => {
        router.push(`/my/edit`);
      }}
    >
      <div className="flex gap-3">
        <LoadableImage
          width={80}
          height={80}
          src={data.org_image || data.photo_url || channelAvatar.src}
        />
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
    <Card className="border border-[#007AFF] mt-0">
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

  const hasWallet = !!useTonAddress();
  return (
    <Card className="mb-12">
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
