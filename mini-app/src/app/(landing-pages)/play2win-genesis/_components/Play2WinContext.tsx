// src/app/(landing-pages)/play2win-genesis/_components/Play2WinContext.tsx
"use client";

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

const mockData: Play2WinData = {
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
};

const Play2WinContext = createContext<Play2WinData>(mockData);

export const usePlay2Win = () => useContext(Play2WinContext);

export const Play2WinProvider = ({ children }: { children: React.ReactNode }) => {
  const [data, setData] = useState<Play2WinData>(mockData);

  useEffect(() => {
    if (data.contest.noGame) return;
    let timer: NodeJS.Timeout;
    timer = setInterval(() => {
      setData((prev) => {
        let { hours, minutes, seconds } = prev.contest;
        if (seconds > 0) {
          seconds -= 1;
        } else if (minutes > 0) {
          minutes -= 1;
          seconds = 59;
        } else if (hours > 0) {
          hours -= 1;
          minutes = 59;
          seconds = 59;
        }
        return {
          ...prev,
          contest: { ...prev.contest, hours, minutes, seconds },
        };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [data.contest.noGame]);

  return <Play2WinContext.Provider value={data}>{children}</Play2WinContext.Provider>;
};
