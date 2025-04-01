'use client'
import LoadableImage from "@/components/LoadableImage";
import CooperationLogoImage from './_assets/images/cooperation-logo.svg'
import GenesisOnionsLogoImage from './_assets/images/genesis-onions.svg'
import { YourNFTs } from "./_components/YourNFTs";
import { RaffleCarousel } from "./_components/RaffleCarousel";

export default function GenesisOnions() {
    return <div className="bg-navy text-white py-5 min-h-screen">
        <div className="flex flex-col items-center gap-1 mb-2">
            <LoadableImage src={CooperationLogoImage} />

            <span className="text-xs">Present</span>
        </div>

        <div className="flex flex-col bg-gradient-radial from-silver-base via-navy items-center justify-center bg-repeat relative mb-3">
            <div className="bg-[url('/rounded-pattern.svg')] h-72 bg-repeat bg-contain w-full absolute top-14 opacity-50 z-0" />
            <LoadableImage src={GenesisOnionsLogoImage} className="mb-11" />

            <RaffleCarousel />
        </div>

        <div className="px-4 flex flex-col gap-3">
            <YourNFTs />
        </div>
    </div>
}