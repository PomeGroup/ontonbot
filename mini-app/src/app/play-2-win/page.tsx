"use client";

import BottomNavigation from "@/components/BottomNavigation";
import Typography from "@/components/Typography";
import { Skeleton } from "@mui/material";
import { Page } from "konsta/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import "swiper/css";
import { Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import CustomCard from "../_components/atoms/cards/CustomCard";
import CustomButton from "../_components/Button/CustomButton";
import DataStatus from "../_components/molecules/alerts/DataStatus";
import { trpc } from "../_trpc/client";

interface TournamentCardProps {
  tournamentId: string;
}

const TournamentCard: React.FC<TournamentCardProps> = ({ tournamentId }) => {
  const router = useRouter();

  const queryEnabeld = !isNaN(Number(tournamentId));
  const tournament = trpc.tournaments.getTournamentById.useQuery(
    { id: Number(tournamentId) },
    {
      enabled: queryEnabeld,
    }
  );

  if (tournament.isError || !queryEnabeld) {
    return null;
  }

  return (
    <SwiperSlide
      key={tournamentId}
      className="!w-[220px]"
    >
      {tournament.isLoading ? (
        <Skeleton className="w-[220px] h-[220px] rounded-md" />
      ) : (
        <Image
          src={tournament.data?.imageUrl}
          width={220}
          height={220}
          onClick={() => {
            router.push(`/play-2-win/${tournamentId}`);
          }}
          className="w-[220px] rounded-md hover:cursor-pointer"
          alt="tournament image card"
        />
      )}
    </SwiperSlide>
  );
};

const Play2WinFeatured = () => {
  const config = trpc.config.getConfig.useQuery();
  // Get the featured events from the config: tId,tId,tId
  const play2winFeaturedEvents = config.data?.config["play-2-win-featured"];
  const parsedFeaturedEvents =
    typeof play2winFeaturedEvents === "string" ? play2winFeaturedEvents?.split(",").map((tId) => tId.trim()) : undefined;

  if (!parsedFeaturedEvents?.length) {
    return null;
  }

  return (
    <>
      <Typography variant="title2">Featured Contests</Typography>
      <div>
        <Swiper
          slidesPerView="auto"
          className="-mx-3"
          spaceBetween={12}
          pagination={{ clickable: true }}
          autoHeight
          modules={[Pagination]}
          wrapperClass="swiper-wrapper pb-3 px-4"
        >
          {parsedFeaturedEvents.map((tId) => (
            <TournamentCard
              tournamentId={tId}
              key={tId}
            />
          ))}
        </Swiper>
      </div>
    </>
  );
};

const PlayToWin: React.FC = () => {
  const router = useRouter();
  const tournomants = trpc.tournaments.getTournaments.useInfiniteQuery(
    {
      limit: 50,
      filter: {
        status: "notended",
      },
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

  return (
    <Page>
      <div className="p-4 flex flex-col gap-2 mb-12">
        <Play2WinFeatured />
        <Typography variant="title2">Discover</Typography>
        <div className="grid grid-cols-2 gap-4">
          {!tournomants.data?.pages[0].tournaments.length && (
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
                  <Link
                    key={tournament.id}
                    href={`/play-2-win/${tournament.id}`}
                  >
                    <CustomCard defaultPadding>
                      <div className="flex flex-col gap-3">
                        <Image
                          src={tournament.imageUrl}
                          width={120}
                          height={120}
                          className="mx-auto rounded-md"
                          alt="game card"
                        />
                        <div className="flex flex-col gap-2">
                          <div className="flex flex-col gap-0.5">
                            <Typography
                              variant="callout"
                              truncate
                            >
                              {tournament.name}
                            </Typography>
                          </div>
                          <div className="flex items-center justify-between">
                            <CustomButton
                              variant="outline"
                              size="md"
                              onClick={() => {
                                router.push(`/play-2-win/${tournament.id}`);
                              }}
                            >
                              Play
                            </CustomButton>
                          </div>
                        </div>
                      </div>
                    </CustomCard>
                  </Link>
                ))
              )}
        </div>
      </div>
      <BottomNavigation active="Play2Win" />
    </Page>
  );
};

export default PlayToWin;
