"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

import { LucideTrophy } from "lucide-react";

import "./page.css";

import { cn } from "@/utils";
import { Instrument_Sans } from "next/font/google";
import Image from "next/image";
import TicketSvg from "./_components/TicketSvg";
import GemIcon from "./_components/icons/GemIcon";
import TicketIcon from "./_components/icons/TicketIcon";

const pageFont = Instrument_Sans({ subsets: ["latin", "latin-ext"], weight: ["400", "500", "600", "700"] });

export default function Play2WinApp() {
  const [hours, setHours] = useState(13);
  const [minutes, setMinutes] = useState(41);
  const [seconds, setSeconds] = useState(27);

  useEffect(() => {
    const timer = setInterval(() => {
      if (seconds > 0) {
        setSeconds(seconds - 1);
      } else {
        if (minutes > 0) {
          setMinutes(minutes - 1);
          setSeconds(59);
        } else {
          if (hours > 0) {
            setHours(hours - 1);
            setMinutes(59);
            setSeconds(59);
          } else {
            clearInterval(timer);
          }
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [hours, minutes, seconds]);

  return (
    <div className={cn("flex flex-col min-h-screen bg-[#031227] text-white", pageFont.className)}>
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center px-5 pt-8 pb-5 overflow-y-auto">
        {/* Top Section with Radial Gradient */}
        <div
          className="w-full flex flex-col items-center"
          style={{ background: "radial-gradient(50% 50% at 50% 50%, #062647 0%, #031227 100%)" }}
        >
          {/* Welcome Header */}
          <div className="text-center mb-4">
            <p className="text-white text-xl">Welcome to</p>
            <h1 className="text-[#51AEFF] text-[48px] leading-[52px] font-normal mb-1">Play2win</h1>
            <p className="text-white text-2xl">Genesis Season</p>
          </div>

          {/* Timer */}
          <div className="flex flex-col items-center gap-1 mb-6">
            <div className="flex justify-center items-end gap-2">
              <div className="flex flex-col items-center">
                <span className="countdown-number text-[#3485FE] text-[32px] leading-[28px] tracking-[-0.26px] font-normal">
                  {hours.toString().padStart(2, "0")}
                </span>
              </div>
              <span className="countdown-number text-[#3485FE] text-[32px] leading-[28px] tracking-[-0.26px] font-normal">
                :
              </span>
              <div className="flex flex-col items-center">
                <span className="countdown-number text-[#3485FE] text-[32px] leading-[28px] tracking-[-0.26px] font-normal">
                  {minutes.toString().padStart(2, "0")}
                </span>
              </div>
              <span className="countdown-number text-[#3485FE] text-[32px] leading-[28px] tracking-[-0.26px] font-normal">
                :
              </span>
              <div className="flex flex-col items-center">
                <span className="countdown-number text-[#3485FE] text-[32px] leading-[28px] tracking-[-0.26px] font-normal">
                  {seconds.toString().padStart(2, "0")}
                </span>
              </div>
            </div>
            <div className="flex justify-center items-start gap-2">
              <div className="flex flex-col items-center">
                <span className="text-xs text-[#8e8e93]">Hour</span>
              </div>
              <div className="w-[1ch]"></div>
              <div className="flex flex-col items-center">
                <span className="text-xs text-[#8e8e93]">Minute</span>
              </div>
              <div className="w-[1ch]"></div>
              <div className="flex flex-col items-center">
                <span className="text-xs text-[#8e8e93]">Second</span>
              </div>
            </div>
          </div>

          {/* Game Card */}
          <div className="mb-3 max-w-60 px-1">
            <div className="backdrop-blur-xl bg-white/10 rounded-2lg p-2 w-full mb-5 min-w-60">
              <div className="flex gap-2">
                <Image
                  src="/template-images/default.webp"
                  alt="Sweet Rush Game"
                  className="rounded-md w-25 h-25 object-cover"
                  width={100}
                  height={100}
                />
                <div className="flex flex-col text-xs justify-center">
                  <h3 className="text-white text-base font-normal mb-2">Sweet Rush</h3>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[#51AEFF]">
                      <TicketIcon />
                    </span>
                    <span
                      className="text-white"
                      style={{ lineHeight: "18px", letterSpacing: "-0.15px" }}
                    >
                      0.5 TON
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[#51AEFF]">
                      <LucideTrophy width={12} />
                    </span>
                    <span
                      className="text-white"
                      style={{ lineHeight: "18px", letterSpacing: "-0.15px" }}
                    >
                      1200 $
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#51AEFF]">
                      <GemIcon />
                    </span>
                    <span
                      className="text-white"
                      style={{ lineHeight: "18px", letterSpacing: "-0.15px" }}
                    >
                      &lt;1500 xp
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-3 text-center">
              <div className="mb-1">
                <span className="text-white">your best score: 1,280</span>
              </div>
              <div className="h-1 bg-[#0f2a45] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#51AEFF] rounded-full"
                  style={{ width: "85%" }}
                ></div>
              </div>
              <p className="text-[#8e8e93] text-sm mt-1">just 220 more to go. Try again!</p>
            </div>
          </div>

          {/* NFT Claim Text */}
          <p className="text-white text-center mb-4">Claim Your Play2Win NFT, join the elite league of players.</p>

          {/* Play Game Button */}
          <Button
            className="w-full text-xl font-semibold rounded-[10px] bg-transparent text-white border-2 border-[#3485FE] hover:bg-[#3485FE]/10 hover:text-white mb-3"
            variant="outline"
          >
            Play Game
          </Button>

          {/* NFT Counter */}
          <p className="text-white text-center mb-5">
            <span className="font-semibold">66 / 100</span> <span className="italic">Play2win NFTs left today</span>
          </p>
        </div>

        {/* NFT Display with Linear Gradient */}
        <div className="w-full flex items-center justify-center mb-6 relative">
          <div
            className="absolute top-0 -left-6 -right-5 h-full"
            style={{ background: "linear-gradient(360deg, #031227 0%, #081A32 49.17%, #031227 100%)" }}
          />
          <div className="rounded-2xl p-2 flex items-center gap-2 border border-white border-opacity-10 z-10 backdrop-blur-md">
            <div className="bg-black w-11 h-11 rounded-lg flex items-center justify-center">
              <span className="text-white text-2xl">?</span>
            </div>
            <div className="flex flex-col">
              <span className="text-white text-center font-normal text-[28px]">0</span>
              <span className="text-[#8e8e93] text-2xs">Your Play2win NFT</span>
            </div>
          </div>
        </div>

        {/* Claim NFT Section */}
        <div className="backdrop-blur-xl bg-white/10 rounded-lg p-5 w-full">
          <TicketSvg className="mx-auto mb-3" />

          <h2 className="text-white text-[32px] leading-[42px] tracking-[1px] font-normal text-center mb-1">
            Claim the New
          </h2>
          <h3 className="text-[#9AD0FF] text-[32px] leading-[42px] tracking-[1px] font-normal text-center underline pb-2 mb-3">
            Play2Win NFT
          </h3>

          <p className="text-white text-center text-sm mb-4">
            Reach the score threshold in today&apos;s game or spin in Genesis ONIONs to earn an NFT.
          </p>

          <Button
            className="w-full text-xl font-semibold rounded-[10px] bg-transparent text-white border-2 border-[#3485FE] hover:bg-[#3485FE]/10 hover:text-white"
            variant="outline"
          >
            Spin in Genesis ONIONs
          </Button>
        </div>
      </div>
    </div>
  );
}
