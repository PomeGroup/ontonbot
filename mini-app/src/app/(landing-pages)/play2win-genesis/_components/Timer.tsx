"use client";
import { useEffect, useState } from "react";

export default function Timer() {
  const [hours, setHours] = useState(13);
  const [minutes, setMinutes] = useState(41);
  const [seconds, setSeconds] = useState(27);

  useEffect(() => {
    const timer = setInterval(() => {
      if (seconds > 0) {
        setSeconds((prev) => prev - 1);
      } else {
        if (minutes > 0) {
          setMinutes((prev) => prev - 1);
          setSeconds(59);
        } else {
          if (hours > 0) {
            setHours((prev) => prev - 1);
            setMinutes(59);
            setSeconds(59);
          } else {
            clearInterval(timer);
          }
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [hours, minutes, seconds]);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex justify-center items-end gap-2">
        <div className="flex flex-col items-center">
          <span className="countdown-number text-[#3485FE] text-[32px] leading-[28px] tracking-[-0.26px] font-normal">
            {hours.toString().padStart(2, "0")}
          </span>
        </div>
        <span className="countdown-number text-[#3485FE] text-[32px] leading-[28px] tracking-[-0.26px] font-normal">:</span>
        <div className="flex flex-col items-center">
          <span className="countdown-number text-[#3485FE] text-[32px] leading-[28px] tracking-[-0.26px] font-normal">
            {minutes.toString().padStart(2, "0")}
          </span>
        </div>
        <span className="countdown-number text-[#3485FE] text-[32px] leading-[28px] tracking-[-0.26px] font-normal">:</span>
        <div className="flex flex-col items-center">
          <span className="countdown-number text-[#3485FE] text-[32px] leading-[28px] tracking-[-0.26px] font-normal">
            {seconds.toString().padStart(2, "0")}
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
