// src/app/(landing-pages)/play2win-genesis/_components/Timer.tsx
"use client";
import { usePlay2Win } from "./Play2WinContext";

export default function Timer() {
  const { contest } = usePlay2Win();

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex justify-center items-end gap-2">
        <div className="flex flex-col items-center">
          <span className="countdown-number text-[#3485FE] text-[32px] leading-[28px] tracking-[-0.26px] font-normal">
            {contest.hours.toString().padStart(2, "0")}
          </span>
        </div>
        <span className="countdown-number text-[#3485FE] text-[32px] leading-[28px] tracking-[-0.26px] font-normal">:</span>
        <div className="flex flex-col items-center">
          <span className="countdown-number text-[#3485FE] text-[32px] leading-[28px] tracking-[-0.26px] font-normal">
            {contest.minutes.toString().padStart(2, "0")}
          </span>
        </div>
        <span className="countdown-number text-[#3485FE] text-[32px] leading-[28px] tracking-[-0.26px] font-normal">:</span>
        <div className="flex flex-col items-center">
          <span className="countdown-number text-[#3485FE] text-[32px] leading-[28px] tracking-[-0.26px] font-normal">
            {contest.seconds.toString().padStart(2, "0")}
          </span>
        </div>
      </div>
      <div className="flex justify-center items-start gap-2">
        <div className="flex flex-col items-center">
          <span className="text-xs text-[#8e8e93]">Hour</span>
        </div>
        <div className="w-[1ch]"></div>
        <div className="flex flex-col items-center">
          <span className="text-xs text-[#8e8e93]">Minute</span>
        </div>
        <div className="w-[1ch]"></div>
        <div className="flex flex-col items-center">
          <span className="text-xs text-[#8e8e93]">Second</span>
        </div>
      </div>
    </div>
  );
}
