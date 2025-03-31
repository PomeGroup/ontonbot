"use client";

import CustomCard from "@/app/_components/atoms/cards/CustomCard";
import { FloatingBadge } from "@/app/_components/Badge/FloatingBadge";
import CustomSwiper from "@/app/_components/CustomSwiper";
import DataStatus from "@/app/_components/molecules/alerts/DataStatus";
import { TournamentTimeRemaining } from "@/app/_components/Tournament/TournamentRemainingTime";
import TournamentCard from "@/app/_components/Tournaments/TournamentCard";
import { trpc } from "@/app/_trpc/client";
import Divider from "@/components/Divider";
import LoadableImage from "@/components/LoadableImage";
import Typography from "@/components/Typography";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { RouterOutput } from "@/server";
import { formatSortTournamentSelectOption, SortOptions, tournamentsListSortOptions } from "@/server/utils/tournaments.utils";
import { cn } from "@/utils";
import { Skeleton } from "@mui/material";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { BsFilterLeft } from "react-icons/bs";
import { FiCheck } from "react-icons/fi";
import { HiOutlineArrowNarrowUp } from "react-icons/hi";

interface TournamentCardProps {
  tournament: RouterOutput["tournaments"]["getFeaturedTournaments"][0];
}

const TournamentSlide: React.FC<TournamentCardProps> = ({ tournament }) => {
  const router = useRouter();

  return (
    <div className="relative isolate w-[220px] h-[220px]">
      <LoadableImage
        src={tournament.imageUrl}
        key={tournament.id}
        width={220}
        height={220}
        onClick={() => {
          router.push(`/play-2-win/${tournament.id}`);
        }}
        className="w-[220px] h-[220px] rounded-md hover:cursor-pointer"
        alt="tournament image card"
      />
      <TournamentTimeRemaining
        space="sm"
        closeOnly
        endDate={tournament.endDate!}
      />
      <FloatingBadge position={"bc-md"}>
        <Typography variant="caption2">+{tournament.playersCount} joined</Typography>
      </FloatingBadge>
    </div>
  );
};

const Play2WinFeatured = () => {
  const featuredEvents = trpc.tournaments.getFeaturedTournaments.useQuery();

  // if error or no result return null
  if (featuredEvents.isError || (featuredEvents.isSuccess && !featuredEvents.data.length)) {
    return;
  }

  return (
    <>
      <Typography variant="title2">Featured Contests</Typography>
      <div>
        <CustomSwiper>
          {featuredEvents.isLoading
            ? Array.from({ length: 5 }).map((_, index) => (
                <Skeleton
                  key={index}
                  className="rounded-md"
                  height={220}
                  width={220}
                  sx={{ transform: "unset" }}
                />
              ))
            : featuredEvents.data.map((tournament) => (
                <TournamentSlide
                  tournament={tournament}
                  key={tournament.id}
                />
              ))}
        </CustomSwiper>
      </div>
    </>
  );
};

const TournamentFilter: React.FC<{
  selected: SortOptions;
  setSelected: (s: SortOptions) => void;
  selectedGame: number;
  setSelectedGame: (g: number) => void;
}> = ({ selected, setSelected, selectedGame, setSelectedGame }) => {
  const gameIds = trpc.tournaments.getGameIds.useQuery();

  return (
    <div className="grid grid-cols-2 gap-3">
      <DropdownMenu>
        <Typography
          variant={"body"}
          weight={"medium"}
        >
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-1 bg-brand-light rounded-md py-1 px-2 justify-between">
              <HiOutlineArrowNarrowUp />
              <span className="truncate">{formatSortTournamentSelectOption(selected)}</span>
              <BsFilterLeft size={18} />
            </button>
          </DropdownMenuTrigger>
        </Typography>
        <DropdownMenuContent className="bg-brand-light border-brand-divider w-full">
          <Typography
            variant="body"
            weight="normal"
            className="px-2"
          >
            Sort By
          </Typography>
          <Divider
            className="my-1"
            color={"dark"}
            height={"1"}
          />
          {tournamentsListSortOptions.map((o) => {
            return (
              <DropdownMenuItem
                key={o}
                onClick={() => setSelected(o)}
                className={cn("flex justify-between items-center", selected === o && "text-primary")}
              >
                <span className="flex gap-1 items-center">
                  <HiOutlineArrowNarrowUp />
                  {formatSortTournamentSelectOption(o)}
                </span>
                <FiCheck className={cn(selected !== o && "opacity-0")} />
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <Typography
          variant={"body"}
          weight={"medium"}
        >
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-1 bg-brand-light rounded-md py-1 px-2 justify-between">
              <span className="truncate">{gameIds.data?.find((g) => g.id === selectedGame)?.name}</span>
              <BsFilterLeft size={18} />
            </button>
          </DropdownMenuTrigger>
        </Typography>
        <DropdownMenuContent className="bg-brand-light border-brand-divider w-full">
          <Typography
            variant="body"
            weight="normal"
            className="px-2"
          >
            Contest type
          </Typography>
          <Divider
            className="my-1"
            color={"dark"}
            height={"1"}
          />
          {gameIds.data?.toReversed().map((game) => {
            return (
              <DropdownMenuItem
                key={game.id}
                onClick={() => setSelectedGame(game.id)}
                className={cn("flex justify-between items-center", selectedGame === game.id && "text-primary")}
              >
                <span>{game.name}</span>
                <FiCheck className={cn(selectedGame !== game.id && "opacity-0")} />
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

const DiscoverTournaments: React.FC = () => {
  const [sortSelected, setSortSelected] = React.useState<SortOptions>("timeRemaining");
  const [selectedGame, setSelectedGame] = useState(-1);

  const tournomants = trpc.tournaments.getTournaments.useInfiniteQuery(
    {
      limit: 50,
      filter: {
        status: "notended",
        gameId: selectedGame,
      },
      sortBy: sortSelected,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

  return (
    <>
      <Typography variant="title2">Discover</Typography>
      {/* 
      Sort dropdown
      */}
      <TournamentFilter
        selected={sortSelected}
        setSelected={(o) => {
          setSortSelected(o);
        }}
        selectedGame={selectedGame}
        setSelectedGame={setSelectedGame}
      />

      <div className="grid grid-cols-2 gap-4">
        {tournomants.isSuccess && !tournomants.data?.pages[0].tournaments.length && (
          <CustomCard
            className="col-span-2"
            defaultPadding
          >
            <DataStatus
              status="not_found"
              title="No tournaments found"
              description="No ongoing tournaments were found."
            />
          </CustomCard>
        )}
        {tournomants.isError && (
          <CustomCard
            className="col-span-2"
            defaultPadding
          >
            <DataStatus
              status="searching"
              title={`Error${tournomants.error instanceof Error ? `: ${tournomants.error.name}` : ""}`}
              description={tournomants.error instanceof Error ? tournomants.error.message : "Error loading tournaments."}
            />
          </CustomCard>
        )}
        {tournomants.isLoading
          ? Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="bg-white rounded-md p-4 flex flex-col gap-3 items-center"
              >
                <Skeleton
                  variant="rectangular"
                  width={120}
                  height={120}
                  className="rounded-md"
                />
                <Skeleton
                  variant="rectangular"
                  width={80}
                  height={36}
                  className="rounded-md mt-2"
                />
              </div>
            ))
          : tournomants.data?.pages.map((page) =>
              page.tournaments.map((tournament) => (
                <TournamentCard
                  key={tournament.id}
                  tournament={tournament}
                />
              ))
            )}
      </div>
    </>
  );
};

/**
 * @component PlayToWin
 *
 * @description
 * This component renders the Play2Win page containing both the featured contests
 * and the discover tournaments sections.
 *
 * @default
 * 😎🚀✨ This is the default export of the PlayToWin page component!
 */
const PlayToWin: React.FC = () => {
  return (
    <>
      <Play2WinFeatured />
      <DiscoverTournaments />
    </>
  );
};

export default PlayToWin;
