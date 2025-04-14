"use client";
import { cn } from "@/utils";
import { Instrument_Sans } from "next/font/google";

import GameCard from "./_components/GameCard";
import NFTClaimSection from "./_components/NFTClaimSection";
import NFTDisplay from "./_components/NFTDisplay";
import Play2WinCard from "./_components/Play2WinCard";
import ScoreProgress from "./_components/ScoreProgress";
import WelcomeHeader from "./_components/WelcomeHeader";

import "./page.css";

const pageFont = Instrument_Sans({ subsets: ["latin", "latin-ext"], weight: ["400", "500", "600", "700"] });

export default function Play2WinApp() {
  return (
    <div
      className={cn("flex flex-col gap-3 min-h-screen p-4 bg-[#050B15] text-white overflow-x-hidden", pageFont.className)}
    >
      {/* Top Section with Radial Gradient */}
      <div
        className="w-full flex flex-col items-center gap-3 relative isolate"
        style={{ background: "radial-gradient(30.77% 15.47% at 50% 69.09%, #062647 0%, #050B15 100%)" }}
      >
        <WelcomeHeader />
        <GameCard />
        <ScoreProgress />
        <NFTDisplay />
        <Play2WinCard />
      </div>
      <NFTClaimSection />
    </div>
  );
}
