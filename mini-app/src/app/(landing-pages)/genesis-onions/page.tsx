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
import { AffiliateInfo } from "./_components/AffiliateInfo";

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
    const [showAffiliateInfo, setShowAffiliateInfo] = useState(false)

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
            <AffiliateInfo open={showAffiliateInfo} onClose={() => setShowAffiliateInfo(false)} />

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
                <div className="flex flex-col bg-gradient-radial from-navy-mid to-navy items-center justify-center bg-repeat relative mb-3 pt-5">
                    <Header />

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
