"use client";
import ActionCard from "@/ActionCard";
import CustomButton from "@/app/_components/Button/CustomButton";
// import CheckUserInList from "@/app/_components/CheckUserInList";
import ticketIcon from "@/app/_components/icons/ticket.svg";
import { trpc } from "@/app/_trpc/client";
import LoadableImage from "@/components/LoadableImage";
import OntonDialog from "@/components/OntonDialog";
import Typography from "@/components/Typography";
import channelAvatar from "@/components/icons/channel-avatar.svg";
import solarCupOutline from "@/components/icons/solar-cup-outline.svg";
import tonIcon from "@/components/icons/ton.svg";
// import { ALLOWED_USER_TO_TEST } from "@/constants";
import { useUserStore } from "@/context/store/user.store";
import { Channel } from "@/types";
import { cn } from "@/utils";
import { useSectionStore } from "@/zustand/useSectionStore";
import { TonConnectButton, useTonAddress, useTonConnectModal } from "@tonconnect/ui-react";
import { Button, Card } from "konsta/react";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import PaymentCard from "./PaymentCard";
import calendarStarIcon from "./calendar-star.svg";

export default function ProfilePage() {
  const { user } = useUserStore();
  const hasWallet = !!useTonAddress();
  const { setSection } = useSectionStore();
  const paid = user?.role === "organizer" || user?.role === "admin";
  const router = useRouter();
  const { data: totalPoints, isLoading: loadingTotalPoints } = trpc.usersScore.getTotalScoreByUserId.useQuery();
  if (!user || loadingTotalPoints) return null;

  return (
    <div>
      {paid ? <InlineChannelCard data={user} /> : <OrganizerProgress step={hasWallet ? 2 : 1} />}
      <ActionCard
        onClick={() => router.push("/my/participated")}
        iconSrc={ticketIcon}
        title="Participated"
        subtitle="Your Activity"
        footerTexts={[
          {
            count: user?.participated_event_count || 0,
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
          paid ? { items: "Events", count: user?.hosted_event_count || 0 } : { items: "Become an organizer first" },
        ]}
      />

      <ActionCard
        onClick={() => {
          router.push("/my/points/");
        }}
        iconSrc={solarCupOutline}
        title="My Points"
        subtitle="You Acheived"
        footerTexts={[{ items: "Points", count: totalPoints || 0 }]}
      />

      <ConnectWalletCard />
      <PaymentCard visible={!paid && hasWallet} />

      {paid && (
        <CustomButton
          onClick={() => {
            setSection("event_setup_form_general_step");
            router.push("/events/create");
          }}
        >
          Create New Event
        </CustomButton>
      )}
    </div>
  );
}

function InlineChannelCard({ data }: { data: Channel | undefined }) {
  const router = useRouter();

  if (!data) return null;
  return (
    <Card
      className="!m-0 w-full cursor-pointer"
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
    <Card className="border border-[#007AFF] w-full !m-0">
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
        Step forward as an organizer, Create your Organizer Channel, Conduct wonderful events and distribute SBT badges to
        your participants.
        <br />
        <b>{step === 1 ? "1. Connect your wallet." : "2. Pay one-time fee to become an organizer"}</b>
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
