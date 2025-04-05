"use client";
import "./_assets/genesis-onions.css";
import Image from "next/image";
import GenesisOnionsLogoImage from "./_assets/images/genesis-onions.svg";
import { YourNFTs } from "./_components/YourNFTs";
import { RaffleCarousel } from "./_components/RaffleCarousel";
import { Capacity } from "./_components/Capacity";
import { useState } from "react";
import { Footer } from "./_components/Footer";
import { AccessRestrictedModal } from "./_components/AccessRestrictedModal";
import { Header } from "./_components/Header";
import { PackagesModal } from "./_components/PackagesModal";
import { Prize } from "./_components/Prize";
import { TokenCampaignNftCollections, TokenCampaignOrders } from "@/db/schema";
import { useUserCampaign } from "./hooks/useUserCampaign";
import { CheckOrderModal } from "./_components/CheckOrderModal";
import { useSpin } from "./hooks/useSpin";

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
    };

    const handleOrderCancel = () => {
        setOrderToCheck(undefined);
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
