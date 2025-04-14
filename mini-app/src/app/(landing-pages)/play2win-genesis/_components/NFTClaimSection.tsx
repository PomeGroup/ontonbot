"use client";
import "@/app/globals.css";

import Image from "next/image";
import Link from "next/link";
import Play2WinGenesisButton from "./Play2WinGenesisButton";
import TicketSvg from "./TicketSvg";

export default function NFTClaimSection() {
  return (
    <>
      <div
        onClick={(e) => {
          if (
            (e.target instanceof Element && !["A", "BUTTON"].includes(e.target.tagName)) ||
            !(e.target instanceof Element)
          ) {
            console.log("NFT claim section clicked");
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
        <p className="text-white text-center text-sm mb-4">
          Reach the score threshold in today&apos;s game or spin in Genesis ONIONs to earn an NFT.
        </p>
        <Link href="/genesis-onions">
          <Play2WinGenesisButton>Spin in Genesis ONIONs</Play2WinGenesisButton>
        </Link>
      </div>
    </>
  );
}
