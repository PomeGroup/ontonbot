"use client";
import "./_assets/genesis-onions.css";
import Image from "next/image";
import GenesisOnionsLogoImage from "./_assets/images/genesis-onions.svg";
import { YourNFTs } from "./_components/YourNFTs";
import { RaffleCarousel } from "./_components/RaffleCarousel";
import { Capacity } from "./_components/Capacity";
import { useState } from "react";
import { Header } from "./_components/Header";
import { TokenCampaignNftCollections, TokenCampaignOrders } from "@/db/schema";
import { useUserCampaign } from "./hooks/useUserCampaign";
import { CheckOrderModal } from "./_components/CheckOrderModal";
import { useSpin } from "./hooks/useSpin";
import dynamic from "next/dynamic";
import { customToast } from "./GenesisOnions.utils";
import { MergeNftsButton } from "./_components/MergeNftsButton";
import { TonConnectButton } from "@tonconnect/ui-react";
import Typography from "@/components/Typography";

const AccessRestrictedModal = dynamic(
  () => import("./_components/AccessRestrictedModal").then((mod) => mod.AccessRestrictedModal),
  {
    ssr: false,
  }
);
const PackagesModal = dynamic(() => import("./_components/PackagesModal").then((mod) => mod.PackagesModal), {
  ssr: false,
});
const Prize = dynamic(() => import("./_components/Prize").then((mod) => mod.Prize), {
  ssr: false,
});
const Footer = dynamic(() => import("./_components/Footer").then((mod) => mod.Footer), {
  ssr: false,
});

export default function GenesisOnions() {
  const { refetchCollections } = useSpin();
  const [prize, setPrize] = useState<TokenCampaignNftCollections>();
  const [showPackagesModal, setShowPackagesModal] = useState(false);
  const [showAccessRestrictedModal, setShowAccessRestrictedModal] = useState(false);
  const { invalidateUserCollection, invalidateUserSpinStats } = useUserCampaign();
  const [orderToCheck, setOrderToCheck] = useState<TokenCampaignOrders>();

  const handleSpinStart = () => {
    setPrize(undefined);
  };

  const handleSpinEnd = (chosenPrize: TokenCampaignNftCollections) => {
    setPrize(chosenPrize);

    invalidateUserCollection();
    refetchCollections();
  };

  const handleInsufficientBalance = () => {
    setShowPackagesModal(true);
  };

  const handleOrderPaid = (order: TokenCampaignOrders) => {
    setOrderToCheck(order);
  };

  const handleOrderSuccess = () => {
    invalidateUserSpinStats();
    setOrderToCheck(undefined);
    customToast.success("Payment was successful! Spin and Enjoy");
  };

  const handleOrderPaymentFailed = (error: Error) => {
    setOrderToCheck(undefined);
    customToast.error(error.message);
  };

  const handleOrderCancel = () => {
    setOrderToCheck(undefined);
    customToast.error("Payment was not successful! Please try again.");
  };

  return (
    <>
      <Prize
        prize={prize}
        onClose={() => setPrize(undefined)}
      />
      <AccessRestrictedModal
        open={showAccessRestrictedModal}
        onClose={() => setShowAccessRestrictedModal(false)}
      />
      {showPackagesModal && (
        <PackagesModal
          open={showPackagesModal}
          onClose={() => setShowPackagesModal(false)}
          onOrderPaid={handleOrderPaid}
          onOrderPaymentFailed={handleOrderPaymentFailed}
        />
      )}
      {orderToCheck && (
        <CheckOrderModal
          order={orderToCheck}
          onClose={() => setOrderToCheck(undefined)}
          onSuccess={handleOrderSuccess}
          onCancel={handleOrderCancel}
        />
      )}
      <main className="bg-navy text-white min-h-screen pb-5">
        <Header />
        <div className="flex jube items-center gap-2 px-4 py-5">
          <div className="border-white flex-wrap border border-solid flex flex-col gap-2 w-fit p-2 bg-white/10 backdrop-blur-lg rounded-2lg">
            <div className="flex justify-between items-center gap-2">
              <Image
                width={40}
                height={40}
                alt="Gold"
                src="https://storage.onton.live/ontonimage/p2w-badge.png"
                className="rounded-md mx-auto"
              />
              <div className="flex flex-col gap-1 justify-center text-center items-center mx-auto flex-wrap">
                <Typography
                  variant="body"
                  weight="medium"
                >
                  Gold
                </Typography>
                <span className="text-[10px]">
                  2.5K <span className="text-[6px]">TON</span>
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center gap-2 text-[9px]">
              <span className="text-[#DFDFDF]">Floor: 8.9 TON</span> <span className="text-[#73E891]">+3.2</span>
            </div>
          </div>
          <div className="border-white flex-wrap border border-solid flex flex-col gap-2 w-fit p-2 bg-white/10 backdrop-blur-lg rounded-2lg">
            <div className="flex justify-between items-center gap-2">
              <Image
                width={40}
                height={40}
                alt="Gold"
                src="https://storage.onton.live/ontonimage/p2w-badge.png"
                className="rounded-md mx-auto"
              />
              <div className="flex flex-col gap-1 justify-center items-center text-center mx-auto flex-wrap">
                <Typography
                  variant="body"
                  weight="medium"
                >
                  Gold
                </Typography>
                <span className="text-[10px]">
                  2.5K <span className="text-[6px]">TON</span>
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center gap-2 text-[9px]">
              <span className="text-[#DFDFDF]">Floor: 8.9 TON</span> <span className="text-[#73E891]">+3.2</span>
            </div>
          </div>
          <div className="border-white flex-wrap border border-solid flex flex-col gap-2 w-fit p-2 bg-white/10 backdrop-blur-lg rounded-2lg">
            <div className="flex justify-between items-center gap-2">
              <Image
                width={40}
                height={40}
                alt="Gold"
                src="https://storage.onton.live/ontonimage/p2w-badge.png"
                className="rounded-md mx-auto"
              />
              <div className="flex flex-col gap-1 justify-center items-center mx-auto flex-wrap text-center">
                <Typography
                  variant="body"
                  weight="medium"
                >
                  Gold
                </Typography>
                <span className="text-[10px]">
                  2.5K <span className="text-[6px]">TON</span>
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center gap-2 text-[9px]">
              <span className="text-[#DFDFDF]">Floor: 8.9 TON</span> <span className="text-[#73E891]">+3.2</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col bg-gradient-radial from-navy-mid to-navy items-center justify-center bg-repeat relative mb-3 pt-5">
          <MergeNftsButton />
          <TonConnectButton />

          <div className="bg-[url('/rounded-pattern.svg')] h-[292px] bg-repeat bg-contain w-full absolute top-28 opacity-50 z-0" />

          <Image
            src={GenesisOnionsLogoImage}
            alt="Secure Your $ONION Airdrop Now"
            className="mb-8"
          />

          <RaffleCarousel
            onEligibilityCheckFailed={() => setShowAccessRestrictedModal(true)}
            onInsufficientBalance={handleInsufficientBalance}
            onSpinStart={handleSpinStart}
            onSpinEnd={handleSpinEnd}
          />
        </div>

        <div className="px-4 flex flex-col gap-3 mb-10">
          <YourNFTs />

          <Capacity />
        </div>

        <Footer />
      </main>
    </>
  );
}
