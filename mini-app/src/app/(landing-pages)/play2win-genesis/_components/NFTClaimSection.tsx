"use client";
import "@/app/globals.css";

import Image from "next/image";
import TicketSvg from "./TicketSvg";

export default function NFTClaimSection() {
  return (
    <div className="rounded-2lg overflow-hidden p-5 w-full relative isolate">
      <Image
        alt="background image of claim card"
        fill
        src="https://storage.onton.live/ontonimage/play-2-win-genesis-card.jpg"
        className="-z-20 object-center object-cover opacity-40"
      />
      <div className="inset-0 absolute bg-white/10 -z-10 blur-xl" />

      <TicketSvg className="mx-auto mb-3" />
      <h2 className="text-white text-[32px] leading-[42px] tracking-[1px] font-normal text-center mb-1">Claim the New</h2>
      <h3 className="text-[#9AD0FF] text-[32px] leading-[42px] tracking-[1px] font-normal text-center underline pb-2 mb-3">
        Play2Win NFT
      </h3>
      <div className="text-white text-center text-xs mb-4">
        <p>Reach the score threshold in today&apos;s game</p>
      </div>
    </div>
  );
}
