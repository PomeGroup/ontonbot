"use client";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import TicketSvg from "./TicketSvg";

export default function NFTClaimSection() {
  return (
    <div className="rounded-2lg overflow-hidden p-5 w-full relative isolate">
      <Link href="/genesis-onions">
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
      </Link>
      <Button
        className="w-full text-xl font-semibold rounded-[10px] bg-transparent text-white border-2 border-[#3485FE] hover:bg-[#3485FE]/10 hover:text-white py-3"
        variant="outline"
        onClick={() => {}}
        type="button"
      >
        Spin in Genesis ONIONs
      </Button>
    </div>
  );
}
