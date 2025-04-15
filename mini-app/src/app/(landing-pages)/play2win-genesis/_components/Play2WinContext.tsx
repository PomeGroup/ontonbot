// src/app/(landing-pages)/play2win-genesis/_components/Play2WinContext.tsx
"use client";

import { trpc } from "@/app/_trpc/client";
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
    gameLink: string | null;
  };
  nftReserved: number;
  userScore: number;
  maxScore: number;
  userPlayed: boolean;
  reachedMaxScore: boolean;
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
    threshold: ">1500",
    gameLink: null,
  },
  nftReserved: 66,
  userScore: 0,
  maxScore: 1500,
  userPlayed: true,
  reachedMaxScore: false,
} satisfies Play2WinData;

const Play2WinContext = createContext<Play2WinData>(mockData);

export const usePlay2Win = () => useContext(Play2WinContext);

export const Play2WinProvider = ({ children }: { children: React.ReactNode }) => {
  const [data, setData] = useState<Play2WinData>(mockData);
  const config = useConfig();

  const userScoreQuery = trpc.tournaments.getUserMaxScore.useQuery({});
  const reservedNFTsQuery = trpc.tournaments.getCampaignUserCount.useQuery({});
  const play2winGameQuery = trpc.tournaments.getOneOngoingTournamentByGameAndPrizeType.useQuery({});

  /*
   SET COUNTDOWN 
  */
  useEffect(() => {
    const endDate = new Date(+config["play2win-enddate"]!);

    const { days } = getTimeLeft(endDate);

    setData((prev) => ({
      ...prev,
      daysLeft: days,
    }));

    const timer = setInterval(() => {
      const { hours, minutes, seconds } = getTimeLeft(endDate);

      setData((prev) => ({
        ...prev,
        daysLeft: days,
        contest: { ...prev.contest, minutes, hours, seconds },
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, [play2winGameQuery.isSuccess]);

  return (
    <Play2WinContext.Provider
      value={{
        ...data,
        userScore: userScoreQuery.data?.maxScore.maxScore ?? 0,
        nftReserved: reservedNFTsQuery.data?.total ?? 0,
        userPlayed: Boolean(userScoreQuery.data?.maxScore.maxScore),
        reachedMaxScore: (userScoreQuery.data?.maxScore.maxScore ?? 0) >= data.maxScore,
        contest: {
          ...data.contest,
          gameLink: play2winGameQuery.data?.tournamentLink ?? "#",
          noGame: !Boolean(play2winGameQuery.data?.tournamentLink),
        },
      }}
    >
      {children}
    </Play2WinContext.Provider>
  );
};
