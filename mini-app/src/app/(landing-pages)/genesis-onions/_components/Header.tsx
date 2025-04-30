"use client";
import { useState, useEffect } from "react";
import { useConfig } from "@/context/ConfigContext";
import Image from "next/image";
import GenesisOnionHead from "./../_assets/images/onion-genesis-merge-haed.svg";
import { ONIONConnectWallet } from "./ONIONConnectWallet";

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
      <ONIONConnectWallet />
    </div>
  );
};
