"use client";

import Typography from "@/components/Typography";
import Image from "next/image";

export default function NFTDisplay() {
  return (
    <div className="flex flex-col gap-4">
      {/* NFT  */}
      <div className="play-2-win-reward-button-border rounded-2lg backdrop-blur-md px-[17px] py-2 flex items-center gap-2 w-fit mx-auto">
        <Image
          alt="Play2Win NFT Image"
          width={44}
          className="rounded-lg w-11 h-11 filter grayscale"
          height={44}
          src="https://storage.onton.live/ontonimage/play-2-win-genesis-ticket.png"
        />
        <Typography
          variant="caption2"
          className="flex text-[10px] leading-4 flex-col text-brand-divider-dark"
        >
          Locked
        </Typography>
      </div>
      {/* Description */}
      <p className="text-white max-w-[282px] text-center text-xs mx-auto">
        Claim Your Play2Win NFT by passing the threshold, join the elite league of players.
      </p>
    </div>
  );
}
