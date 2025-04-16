"use client";
import "@/app/globals.css";

import Typography from "@/components/Typography";
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
      <h2 className="text-white text-base leading-[20px] tracking-[1px] font-normal text-center mb-1">Claim the New</h2>
      <h1 className="text-[24px] leading-[32px] tracking-[1px] font-bold text-center mb-3">Play2Win NFT</h1>
      <div className="text-whitetext-xs text-start flex flex-col gap-2">
        <ol className="flex flex-col gap-2">
          <li className="flex gap-2 items-center">
            <span className="font-bold text-base leading-[22px]">1.</span>
            <Image
              src="https://storage.onton.live/ontonimage/p2w_1.png"
              width={60}
              height={60}
              alt="icon"
              className="scale-150 !w-15 !h-15"
            />
            <Typography
              variant="body"
              className="leading-[22px] -0.08"
            >
              Exclusive access to competitive gated Play2Win tournaments.
            </Typography>
          </li>
          <li className="flex gap-2 items-center">
            <span className="font-bold text-base leading-[22px]">2.</span>
            <Image
              src="https://storage.onton.live/ontonimage/p2w_2.png"
              width={60}
              height={60}
              alt="icon"
              className="scale-150 !w-15 !h-15"
            />
            <Typography
              variant="body"
              className="leading-[22px] -0.08"
            >
              Airdrop of ONION tokens to Play2Win NFT holders.
            </Typography>
          </li>
          <li className="flex gap-2 items-center">
            <span className="font-bold text-base leading-[22px]">3.</span>
            <Image
              src="https://storage.onton.live/ontonimage/p2w_3.png"
              width={60}
              height={60}
              alt="icon"
              className="scale-150 !w-15 !h-15"
            />
            <Typography
              variant="body"
              className="leading-[22px] -0.08"
            >
              Access to the Community Sale Elympics.
            </Typography>
          </li>
          <li className="flex gap-2 items-center">
            <span className="font-bold text-base leading-[22px]">4.</span>
            <Image
              src="https://storage.onton.live/ontonimage/p2w_4.png"
              width={60}
              height={60}
              alt="icon"
              className="scale-150 !w-15 !h-15"
            />
            <Typography
              variant="body"
              className="leading-[22px] -0.08"
            >
              10,000 Elympics Respect Points drop for holders.
            </Typography>
          </li>
        </ol>
        <Typography variant="subheadline2">
          This NFT isn’t just a collectible — it’s your passport to the Genesis Season.
        </Typography>
      </div>
    </div>
  );
}
