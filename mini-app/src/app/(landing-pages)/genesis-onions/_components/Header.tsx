// import CustomButton from "@/app/_components/Button/CustomButton";
// import Typography from "@/components/Typography";
// import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from "@/components/ui/dropdown-menu";
// import { UnplugIcon } from "lucide-react";
"use client";
import { useState, useEffect } from "react";
import { useConfig } from "@/context/ConfigContext";
import Image from "next/image";
import GenesisOnionHead from "./../_assets/images/onion-genesis-merge-haed.svg";

export const Header = () => {
  const config = useConfig();
  const endDateString = config["campeign_merge_date"];

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const endDate = endDateString ? new Date(endDateString) : null;
    if (!endDate) return;
    const updateTimer = () => {
      const now = Date.now();
      const distance = endDate.getTime() - now;
      if (distance < 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);
      setTimeLeft({ days, hours, minutes, seconds });
    };
    updateTimer();
    const timerId = setInterval(updateTimer, 1000);
    return () => clearInterval(timerId);
  }, [endDateString]);

  return (
    <div className="flex justify-between px-4 py-3 items-center gap-2 bg-navy-dark">
      <div className="text-xs">
        <Image
          src={GenesisOnionHead}
          alt="Secure Your $ONION Airdrop Now"
        />
        <div className="text-white sansation-bold text-sm">
          {timeLeft.days} <span className="text-[9px] sansation-normal">D </span>: {timeLeft.hours}{" "}
          <span className="text-[9px] sansation-normal">H </span>: {timeLeft.minutes}{" "}
          <span className="text-[9px] sansation-normal">M </span>: {timeLeft.seconds}{" "}
          <span className="text-[9px] sansation-normal">S</span>
        </div>
      </div>
      {/* <DropdownMenu> */}
      {/*   <DropdownMenuTrigger asChild> */}
      {/*     <CustomButton */}
      {/*       variant="primary-onion" */}
      {/*       btnClassName="!w-fit" */}
      {/*       fontWeight="semibold" */}
      {/*     > */}
      {/*       Connect Wallet */}
      {/*     </CustomButton> */}
      {/*   </DropdownMenuTrigger> */}
      {/*   <DropdownMenuContent className="!bg-navy rounded-2lg p-3 flex items-center gap-2 border border-solid border-brand-divider-dark text-onion-extraLight"> */}
      {/*     <UnplugIcon /> */}
      {/*     <Typography */}
      {/*       variant="body" */}
      {/*       weight="medium" */}
      {/*     > */}
      {/*       Disconnect */}
      {/*     </Typography> */}
      {/*   </DropdownMenuContent> */}
      {/* </DropdownMenu> */}
    </div>
  );
};
