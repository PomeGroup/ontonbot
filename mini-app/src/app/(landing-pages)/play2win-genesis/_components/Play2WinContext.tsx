"use client";

import { trpc } from "@/app/_trpc/client";
import { useConfig } from "@/context/ConfigContext";
import { getTimeLeft } from "@/lib/time.utils";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { P2WUnlockedDialog } from "./P2WUnlockedDialog";

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
  showNFTDialog: boolean;
  collectionLink: string;
  setShowNFTDialog: (open: boolean) => void;
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
  showNFTDialog: false,
  collectionLink: "#",
  setShowNFTDialog: () => {},
} satisfies Play2WinData;

const Play2WinContext = createContext<Play2WinData>(mockData);

export const usePlay2Win = () => useContext(Play2WinContext);

const NFT_DIALOG_SHOWN_KEY = "p2wgenesis_nft_dialog_shown";

export const Play2WinProvider = ({ children }: { children: React.ReactNode }) => {
  const [data, setData] = useState<Play2WinData>(mockData);
  const [showNFTDialog, setShowNFTDialogState] = useState(false);
  const config = useConfig();

  const userScoreQuery = trpc.tournaments.getUserMaxScore.useQuery({});
  const reservedNFTsQuery = trpc.tournaments.getCampaignUserCount.useQuery({});
  const play2winGameQuery = trpc.tournaments.getOneOngoingTournamentByGameAndPrizeType.useQuery({});

  // persist dialog shown in localStorage
  const setShowNFTDialog = useCallback((open: boolean) => {
    setShowNFTDialogState(open);
    if (open) {
      window?.localStorage?.setItem(NFT_DIALOG_SHOWN_KEY, "1");
    }
  }, []);

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
      const { hours, minutes, seconds } = getTimeLeft(new Date(play2winGameQuery.data?.endDate!));

      setData((prev) => ({
        ...prev,
        daysLeft: days,
        contest: { ...prev.contest, minutes, hours, seconds },
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, [play2winGameQuery.isSuccess]);

  // Open dialog if reached the max score and dialog never shown before
  useEffect(() => {
    const localAlreadyShown = typeof window !== "undefined" && localStorage.getItem(NFT_DIALOG_SHOWN_KEY) === "1";
    const reachedMaxScore = (userScoreQuery.data?.maxScore.maxScore ?? 0) >= mockData.maxScore;
    if (reachedMaxScore && !localAlreadyShown) {
      setShowNFTDialogState(true);
      window?.localStorage?.setItem(NFT_DIALOG_SHOWN_KEY, "1");
    }
  }, [userScoreQuery.data?.maxScore.maxScore]);

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
        showNFTDialog,
        setShowNFTDialog,
      }}
    >
      {children}
      <P2WUnlockedDialog />
    </Play2WinContext.Provider>
  );
};
