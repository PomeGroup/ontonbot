"use client";
import { cn } from "@/utils";
import { Instrument_Sans } from "next/font/google";

import GameCard from "./_components/GameCard";
import NFTClaimSection from "./_components/NFTClaimSection";
import NFTDisplay from "./_components/NFTDisplay";
import Play2WinCard from "./_components/Play2WinCard";
import WelcomeHeader from "./_components/WelcomeHeader";

import Image from "next/image";
import { Play2WinProvider } from "./_components/Play2WinContext";
import ScoreProgress from "./_components/ScoreProgress";
import Timer from "./_components/Timer";
import "./page.css";

const pageFont = Instrument_Sans({ subsets: ["latin", "latin-ext"], weight: ["400", "500", "600", "700"] });

function Play2WinApp() {
  return (
    <Play2WinProvider>
      <div
        className={cn("flex flex-col gap-3 min-h-screen p-4 bg-[#050B15] text-white overflow-x-hidden", pageFont.className)}
      >
        {/* Top Section with Radial Gradient */}
        <div
          className="w-full flex flex-col items-center gap-3 relative isolate"
          style={{ background: "radial-gradient(30.77% 15.47% at 50% 69.09%, #062647 0%, #050B15 100%)" }}
        >
          <WelcomeHeader />
          <div className="relative w-full flex flex-col items-center gap-3 ">
            <Timer />
            <GameCard />
            <ScoreProgress />
            <NFTDisplay />
            <Play2WinCard />
            <div className="absolute -left-12 -z-10 opacity-30 h-full w-[] -right-18 bottom-0">
              <Image
                src="https://storage.onton.live/ontonimage/p2w-black-hole.jpg"
                fill
                alt="background"
                className="object-cover"
              />
            </div>
          </div>
        </div>
        <NFTClaimSection />
      </div>
    </Play2WinProvider>
  );
}

export default Play2WinApp;
