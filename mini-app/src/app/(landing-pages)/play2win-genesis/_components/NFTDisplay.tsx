"use client";

import Image from "next/image";

export default function NFTDisplay() {
  return (
    <div className="flex flex-col gap-4">
      {/* NFT  */}
      <div className="play-2-win-reward-button-border rounded-2xl backdrop-blur-md px-4 py-2 flex items-center gap-2 w-fit mx-auto">
        <Image
          alt="Play2Win NFT Image"
          width={44}
          className="rounded-lg w-11 h-11 filter grayscale"
          height={44}
          src="https://storage.onton.live/ontonimage/play-2-win-genesis-ticket.png"
        />
        <div className="flex flex-col text-white">Locked</div>
      </div>
      {/* Description */}
      <p className="text-white max-w-[282px] text-center text-xs">
        Claim Your Play2Win NFT by passing the threshold, join the elite league of players.
      </p>
    </div>
  );
}
