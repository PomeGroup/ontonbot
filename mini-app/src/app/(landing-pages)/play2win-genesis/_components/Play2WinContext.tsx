// src/app/(landing-pages)/play2win-genesis/_components/Play2WinContext.tsx
"use client";

import { useConfig } from "@/context/ConfigContext";
import { getTimeLeft } from "@/lib/time.utils";
import React, { createContext, useContext, useEffect, useState } from "react";

type Play2WinData = {
  daysLeft: number;
  contest: {
    noGame: boolean;
    hours: number;
    minutes: number;
    seconds: number;
    gameTitle: string;
    ticketPrice: string;
    reward: string;
    threshold: string;
    gameLink: string;
  };
  nftReserved: number;
  userScore: number;
  maxScore: number;
  userPlayed: boolean;
};

const mockData = {
  daysLeft: 20,
  contest: {
    noGame: false,
    hours: 13,
    minutes: 41,
    seconds: 27,
    gameTitle: "Sweet Rush",
    ticketPrice: "0.5 TON",
    reward: "$150",
    threshold: ">1500 xp",
    gameLink: "#",
  },
  nftReserved: 66,
  userScore: 480,
  maxScore: 1500,
  userPlayed: true,
} satisfies Play2WinData;

const Play2WinContext = createContext<Play2WinData>(mockData);

export const usePlay2Win = () => useContext(Play2WinContext);

export const Play2WinProvider = ({ children }: { children: React.ReactNode }) => {
  const [data, setData] = useState<Play2WinData>(mockData);
  const config = useConfig();

  useEffect(() => {
    if (data.contest.noGame) return;

    const endDate = new Date(+config["play2win-enddate"]!);
    console.log("endate", endDate);

    const { days, hours, minutes, seconds } = getTimeLeft(endDate);

    setData((prev) => ({
      ...prev,
      daysLeft: days,
      contest: { ...prev.contest, minutes, hours, seconds },
    }));

    const timer = setInterval(() => {
      const { days, hours, minutes, seconds } = getTimeLeft(endDate);

      setData((prev) => ({
        ...prev,
        daysLeft: days,
        contest: { ...prev.contest, minutes, hours, seconds },
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, [data.contest.noGame]);

  return <Play2WinContext.Provider value={data}>{children}</Play2WinContext.Provider>;
};
