"use client";
import { LucideTrophy } from "lucide-react";
import Image from "next/image";
import GemIcon from "./icons/GemIcon";
import TicketIcon from "./icons/TicketIcon";

export default function GameCard() {
  return (
    <div className="px-1">
      <div className="backdrop-blur-xl bg-white/10 rounded-2lg p-2 w-full min-w-60">
        <div className="flex gap-2">
          <Image
            src="https://storage.onton.live/ontonimage/sweet_rush.jpg"
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
    </div>
  );
}
