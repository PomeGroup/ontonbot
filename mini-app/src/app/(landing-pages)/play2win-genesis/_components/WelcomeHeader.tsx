// src/app/(landing-pages)/play2win-genesis/_components/WelcomeHeader.tsx
import Typography from "@/components/Typography";
import Image from "next/image";
import React from "react";
import { usePlay2Win } from "./Play2WinContext";

const WelcomeHeader: React.FC = () => {
  const { daysLeft } = usePlay2Win();

  return (
    <div className="text-center flex flex-col gap-2">
      <div className="absolute -left-4 -top-4 -z-10 h-[210px] w-screen opacity-40">
        <Image
          src="https://storage.onton.live/ontonimage/p2w-head-bg.jpg"
          fill
          alt="background"
          className="object-bottom object-cover"
        />
      </div>
      <p className="text-white text-xl">Welcome to</p>
      <h1 className="text-[#51AEFF] text-[48px] leading-[52px] font-normal mb-1">Play2win</h1>
      <p className="text-white text-2xl">Genesis Season</p>
      {/* Badge */}
      <div className="bg-[#050B15] text-white border border-[#183C72] rounded-md py-0.75 px-3 min-w-min w-fit mx-auto">
        <Typography
          variant="caption1"
          className="flex gap-1 items-center justify-center"
        >
          <span className="font-medium">{daysLeft}</span>
          Days left
        </Typography>
      </div>
    </div>
  );
};

export default WelcomeHeader;
