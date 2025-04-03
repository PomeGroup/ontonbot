'use client'
import Image from 'next/image';
import GenesisOnionsLogoImage from './_assets/images/genesis-onions.svg';
import { YourNFTs } from "./_components/YourNFTs";
import { RaffleCarousel } from "./_components/RaffleCarousel";
import { Capacity } from "./_components/Capacity";
import { useState } from 'react';
import { Footer } from './_components/Footer';
import { AccessRestrictedModal } from './_components/AccessRestrictedModal';
import { Header } from './_components/Header';
import { PackagesModal } from './_components/PackagesModal';
import { Prize } from './_components/Prize';

export default function GenesisOnions() {
    const [showConfetti, setShowConfetti] = useState(false);
    const [showPackagesModal, setShowPackagesModal] = useState(false);
    const [showAccessRestrictedModal, setShowAccessRestrictedModal] = useState(false);
    const [showPrize, setShowPrize] = useState(false);

    const handleSpinStart = () => {
        setShowConfetti(false);
    }

    const handleSpinEnd = () => {
        setShowConfetti(true);

        setTimeout(() => {
            setShowConfetti(false);
        }, 20_000);
    }

    const handleInsufficientBalance = () => {
        setShowPackagesModal(true);
    }

    return <>
        <Prize isOpen={showPrize} />
        <AccessRestrictedModal open={showAccessRestrictedModal} onClose={() => setShowAccessRestrictedModal(false)} />
        <PackagesModal open={showPackagesModal} onClose={() => setShowPackagesModal(false)} />


        <main className="bg-navy text-white py-5 min-h-screen">
            <Header />
            <button onClick={() => setShowPrize(true)}>Show prize</button>

            <div className="flex flex-col bg-gradient-radial from-silver-base via-navy items-center justify-center bg-repeat relative mb-3">
                <div className="bg-[url('/rounded-pattern.svg')] h-72 bg-repeat bg-contain w-full absolute top-14 opacity-50 z-0" />
                <Image src={GenesisOnionsLogoImage} alt="Secure Your $ONION Airdrop Now" className="mb-11" />


                <RaffleCarousel
                    onInsufficientBalance={handleInsufficientBalance}
                    onSpinStart={handleSpinStart}
                    onSpinEnd={handleSpinEnd} />
            </div>

            <div className="px-4 flex flex-col gap-3 mb-10">
                <YourNFTs />

                <Capacity />
            </div>

            <Footer />
        </main>
    </>
}