"use client";
import "@/app/globals.css";

import Typography from "@/components/Typography";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { usePlay2Win } from "./Play2WinContext";
import Play2WinGenesisButton from "./Play2WinGenesisButton";
import { Play2WinGenesisDialog } from "./Play2WinGenesisDialog";
import TicketSvg from "./TicketSvg";

export default function NFTClaimSection() {
  // Open state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { contest } = usePlay2Win();

  return (
    <>
      <div
        onClick={(e) => {
          if (
            (e.target instanceof Element && !["A", "BUTTON"].includes(e.target.tagName)) ||
            !(e.target instanceof Element)
          ) {
            setIsDialogOpen(true);
          }
        }}
        className="rounded-2lg overflow-hidden p-5 w-full relative isolate cursor-pointer active:opacity-80"
      >
        <Image
          alt="background image of claim card"
          fill
          src="https://storage.onton.live/ontonimage/play-2-win-genesis-card.jpg"
          className="-z-20 opacity-40"
        />
        <div className="inset-0 absolute bg-white/10 -z-10 blur-xl" />

        <TicketSvg className="mx-auto mb-3" />
        <h2 className="text-white text-[32px] leading-[42px] tracking-[1px] font-normal text-center mb-1">Claim the New</h2>
        <h3 className="text-[#9AD0FF] text-[32px] leading-[42px] tracking-[1px] font-normal text-center underline pb-2 mb-3">
          Play2Win NFT
        </h3>
        <div className="text-white text-center text-xs mb-4">
          <p>Reach the score threshold in today&apos;s game</p>
          <p>OR</p>
          <p>spin in Genesis ONIONs and win Gold or Silver to earn a Play2win</p>
          NFT.
        </div>
        <Link href="/genesis-onions">
          <Play2WinGenesisButton>Spin in Genesis ONIONs</Play2WinGenesisButton>
        </Link>
      </div>
      <Play2WinGenesisDialog
        title="Play2win NFT"
        onOpenChange={(open) => {
          setIsDialogOpen(open);
        }}
        open={isDialogOpen}
        hideTrigger
      >
        <div className="max-w-md w-full overflow-auto max-h-[510px]">
          {/* How to Get Section */}
          <div className="">
            <Typography
              variant="title2"
              weight="normal"
              className="text-center"
            >
              How to Get?
            </Typography>

            {/* Option A */}
            <div className="">
              <div className="flex items-start gap-3">
                <span className="mt-0.5">🎯</span>
                <span className="font-semibold text-lg">Option A: Play Sweet Rush</span>
              </div>
              <p className="ml-8">Score 1500+ points, or play 10 times, and the NFT is yours.</p>
              <p className="ml-8">We track your best score and show you how close you are!</p>
              <div className="pt-4">
                <Play2WinGenesisButton disabled={contest.noGame}>Play Game</Play2WinGenesisButton>
              </div>
            </div>

            {/* Option B */}
            <div className="">
              <div className="flex items-start gap-3">
                <span className="mt-0.5">🎲</span>
                <span className="font-semibold text-lg">Option B: Spin to Win</span>
              </div>
              <p className="ml-8">Try your luck on the Spin Wheel and win the NFT instantly!</p>
              <p className="ml-8">It&apos;s fast, fun, and you might score big on your first try.</p>
              <Play2WinGenesisButton>Spin Now!</Play2WinGenesisButton>
            </div>
          </div>

          {/* Footer Text */}
          <p className="text-center">
            This NFT isn&apos;t just a collectible — it&apos;s your passport to the Genesis Season.
          </p>
        </div>
      </Play2WinGenesisDialog>
    </>
  );
}
