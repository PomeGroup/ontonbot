"use client";

import Image from "next/image";

export default function NFTDisplay() {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl bg-white/[3%] backdrop-blur-md px-4 py-2 flex items-center gap-2 border border-white border-opacity-10 w-fit mx-auto">
        <Image
          alt="Play2Win NFT Image"
          width={44}
          className="rounded-2lg w-11 h-11 filter grayscale"
          height={44}
          src="https://storage.onton.live/ontonimage/play-2-win-genesis-ticket.png"
        />
        <div className="flex flex-col">Locked</div>
      </div>
      <p className="text-white max-w-[282px] text-center text-xs">
        Claim Your Play2Win NFT by passing the threshold, join the elite league of players.
      </p>
    </div>
  );
}
