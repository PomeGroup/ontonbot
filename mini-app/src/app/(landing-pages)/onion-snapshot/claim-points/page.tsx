"use client";

import CustomCard from "@/app/_components/atoms/cards/CustomCard";
import CustomSheet from "@/app/_components/Sheet/CustomSheet";
import { trpc } from "@/app/_trpc/client";
import Typography from "@/components/Typography";
import { AlertGeneric } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/table";
import { WalletSummary } from "@/db/modules/claimOnion.db";
import { formatWalletAddress } from "@/lib/utils";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { Address } from "@ton/core";
import { useTonConnectUI, useTonWallet } from "@tonconnect/ui-react";
import { Wallet2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useClaimPointsContext } from "./ClaimPointsContext";

function OnionStockBanner() {
  const { wallets } = useClaimPointsContext();
  return (
    <div className="rounded-lg bg-gradient-to-br from-[#FFAE6E] to-[#F36A00] opacity-60 border shadow-inner backdrop-blur-sm flex flex-col justify-center items-center gap-4 py-4 w-full">
      <div className="flex flex-col gap-2">
        <div className="font-medium text-[13px] leading-[1.38] text-center text-white tracking-tightest">
          Your Current Stock is
        </div>
        <div className="font-bold text-3xl leading-tight text-center text-white tracking-tighter">
          {Number(wallets?.reduce((pv, cv) => pv + cv.totalOnions, 0))}? ONIONs
        </div>
      </div>
    </div>
  );
}

function SnapshotResultCard() {
  const pointWallets = useClaimPointsContext();

  return (
    <CustomCard
      className="flex flex-col gap-4 p-5 rounded-[10px]"
      defaultPadding={false}
    >
      <Typography
        variant="title3"
        className="text-center text-black"
      >
        Snapshot Result
      </Typography>

      <div className="h-[1px] bg-brand-bg w-full" />
      {!pointWallets.wallets?.length && (
        <>
          <p className="text-center text-black">
            You can easily Claim the ONIONs you’ve earned during the snapshot phase. It’s a great way to see what you’ve
            accumulated!
          </p>
          <div className="flex flex-col gap-2 w-full">
            <div className="flex flex-col items-center gap-2 p-4 rounded-[10px] bg-[#EFEFF4]/50 flex-1">
              <img
                src="https://storage.onton.live/ontonimage/gem_nft_onions_icon.svg"
                alt="ONION NFTs icon"
                className="w-[60px] h-[60px]"
              />
              <Typography
                variant="subheadline1"
                className="text-center text-[#575757]"
              >
                ONION NFTs
              </Typography>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-[10px] bg-[#EFEFF4]/50 flex-1">
              <img
                src="https://storage.onton.live/ontonimage/ticket_onions_icon.svg"
                alt="Event Attendance icon"
                className="w-[60px] h-[60px]"
              />
              <Typography
                variant="subheadline1"
                className="text-center text-[#575757]"
              >
                Event Attendance
              </Typography>
            </div>
          </div>
        </>
      )}

      {pointWallets.wallets?.map((wallet) => (
        <WalletSummaryCard
          key={wallet.walletAddress}
          wallet={wallet}
        />
      ))}

      {pointWallets.wallets?.length && pointWallets.wallets.every((wallet) => wallet.claimStatus === "claimed") && (
        <ConnectNewWalletCard />
      )}

      {pointWallets.wallets?.length && pointWallets.wallets.every((wallet) => wallet.claimStatus === "claimed") && (
        <AlertGeneric variant="info-light">
          To claim your ONIONs for the NFTs you own, you need to disconnect your current wallet and connect a new one.
        </AlertGeneric>
      )}
    </CustomCard>
  );
}

function ConnectNewWalletCard(props: { buttonText?: string }) {
  const [tonconnectUi] = useTonConnectUI();
  const { setOpenConnect } = useClaimPointsContext();

  return (
    <Button
      variant="primary"
      size="lg"
      onClick={(e) => {
        e.preventDefault();
        if (tonconnectUi.account?.address) {
          void tonconnectUi.disconnect();
        }
        setOpenConnect(true);
      }}
    >
      {props.buttonText ? props.buttonText : "Connect a New Wallet"}
    </Button>
  );
}

function WalletSummaryCard({ wallet }: { wallet: WalletSummary }) {
  return (
    <div className="bg-brand-bg p-2 rounded-2lg gap-2 flex flex-col">
      {/* Wallet */}
      <div className="flex items-center p-2 gap-2">
        <Wallet2Icon
          className="text-info-dark"
          size={16}
        />
        <Typography
          variant="subheadline1"
          weight="normal"
          className="text-info-dark"
        >
          Wallet Address:
        </Typography>
        <Typography
          variant="body"
          weight="medium"
        >
          {formatWalletAddress(Address.parse(wallet.walletAddress).toString({ bounceable: false }))}
        </Typography>
      </div>
      {/* ONION NFTs  */}
      <div className="flex flex-col gap-2 bg-white p-3 rounded-2lg no-scrollbar">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <img
              src="https://storage.onton.live/ontonimage/gem_nft_onions_icon.svg"
              alt="ONION NFTs icon"
              className="w-[24px] h-[24px]"
            />
            <Typography
              variant="subheadline1"
              weight="normal"
            >
              ONION NFTs
            </Typography>
          </div>
          <Typography
            variant="body"
            weight="medium"
          >
            {wallet.nft.totalOnions} ONIONS
          </Typography>
        </div>
        {/* NFT Table */}
        <Table className="min-w-full">
          <TableBody>
            <TableRow className="border-b">
              <TableCell>
                <Typography
                  variant="caption1"
                  weight="normal"
                  className="text-info-dark"
                >
                  NFT
                </Typography>
              </TableCell>
              {Object.keys(wallet.nft.counts).map((tier, index) => (
                <TableHead key={index}>
                  <Typography
                    variant="caption1"
                    weight="normal"
                    className="text-center text-info-dark"
                  >
                    {tier}
                  </Typography>
                </TableHead>
              ))}
            </TableRow>
            <TableRow className="border-b">
              <TableCell>
                <Typography
                  variant="caption1"
                  weight="normal"
                  className="text-info-dark"
                >
                  Count
                </Typography>
              </TableCell>
              {Object.values(wallet.nft.counts).map((count, index) => (
                <TableHead key={index}>
                  <Typography
                    variant="caption1"
                    weight="normal"
                    className="text-center text-info-dark"
                  >
                    {count}
                  </Typography>
                </TableHead>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </div>
      {/* ONTON Points */}
      <div className="flex flex-col gap-2 bg-white p-3 rounded-2lg">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <img
              src="https://storage.onton.live/ontonimage/ticket_onions_icon.svg"
              alt="ONTON Points icon"
              className="w-[24px] h-[24px]"
            />
            <Typography
              variant="subheadline1"
              weight="normal"
            >
              ONTON Points
            </Typography>
          </div>
          <Typography
            variant="body"
            weight="medium"
          >
            {wallet.totalOnions} ONIONs
          </Typography>
        </div>
      </div>
      <AlertGeneric variant="info-light">Your ONTON points will be used in your first wallet only.</AlertGeneric>
      {wallet.claimStatus === "not_claimed" && <ClaimPointsModal wallet={wallet} />}
    </div>
  );
}

function OnionBenefitsCard() {
  // TODO: the disks should look like the disks in the design
  return (
    <div className="flex flex-col gap-2 p-3 rounded-[10px] bg-[#EFEFF4]/50">
      <Typography
        variant="subheadline1"
        className="text-black font-normal leading-tight tracking-tighter text-sm"
      >
        Use ONION, the governance token, to enable:
      </Typography>
      <ul className={`list-inside list-disc space-y-1`}>
        <li className="text-black font-normal leading-snug tracking-tight text-xs">
          <Typography
            variant="footnote"
            className="inline text-black font-normal leading-snug tracking-tight text-xs"
          >
            Event discounts, staking yields, and access to community events.
          </Typography>
        </li>
        <li className="text-black font-normal leading-snug tracking-tight text-xs">
          <Typography
            variant="footnote"
            className="inline text-black font-normal leading-snug tracking-tight text-xs"
          >
            Participation airdrops reward community contributors.
          </Typography>
        </li>
        <li className="text-black font-normal leading-snug tracking-tight text-xs">
          <Typography
            variant="footnote"
            className="inline text-black font-normal leading-snug tracking-tight text-xs"
          >
            DAO governance enhances decision-making with SBT-weighted voting for fair representation.
          </Typography>
        </li>
      </ul>
    </div>
  );
}

function ClaimPointsModal({ wallet }: { wallet: WalletSummary }) {
  const [isOpen, setIsOpen] = useState(false);

  const trpcUtils = trpc.useUtils();

  const claimPoints = trpc.campaign.claimOnion.useMutation({
    onSuccess: () => {
      setIsOpen(true);
    },
    onError: () => {
      toast.error("Failed to claim ONIONs");
    },
  });

  const handleClaimPoints = () => {
    claimPoints.mutate({
      walletAddress: wallet.walletAddress,
    });
  };

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      trpcUtils.campaign.getClaimOverview.invalidate();
    }, 50);
  };

  return (
    <div>
      <Button
        variant="primary"
        size="default"
        className="w-full"
        onClick={(e) => {
          e.preventDefault();
          handleClaimPoints();
        }}
        isLoading={claimPoints.isLoading}
      >
        Claim ONIONs
      </Button>
      <CustomSheet
        opened={isOpen}
        title={
          <div className="relative w-[184px] h-[184px] -mb-20 -mt-18">
            <DotLottieReact
              loop
              autoplay
              src={"https://storage.onton.live/ontonimage/confetti_lottie.json"}
              className="absolute top-3/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[184px] h-[184px]"
              width={568}
              height={568}
            />
            <DotLottieReact
              loop
              autoplay
              src={"https://storage.onton.live/ontonimage/coin_lottie.json"}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              width={184}
              height={184}
            />
          </div>
        }
        centerTitle
        hideClose
        onClose={handleClose}
      >
        <div className="flex flex-col gap-4">
          {/* Header */}
          <div className="flex flex-col gap-1 text-center">
            <Typography
              variant="body"
              weight="normal"
            >
              Congratulations! You’ve earned
            </Typography>
            <Typography
              variant="title1"
              className="font-bold"
            >
              {Number(claimPoints.data?.claim.totalOnions)} ONIONs
            </Typography>
            <Typography
              variant="body"
              weight="normal"
            >
              Based on your profile.
            </Typography>
          </div>

          <OnionBenefitsCard />
          <Button
            variant="primary"
            className="w-full"
            onClick={(e) => {
              e.preventDefault();
              handleClose();
            }}
          >
            Close
          </Button>
        </div>
      </CustomSheet>
    </div>
  );
}

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
