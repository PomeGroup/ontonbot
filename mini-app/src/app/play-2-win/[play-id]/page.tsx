"use client";

import MainButton from "@/app/_components/atoms/buttons/web-app/MainButton";
import CustomCard from "@/app/_components/atoms/cards/CustomCard";
import { ErrorState } from "@/app/_components/ErrorState";
import EventKeyValue from "@/app/_components/organisms/events/EventKewValue";
import Divider from "@/components/Divider";
import LoadableImage from "@/components/LoadableImage";
import Typography from "@/components/Typography";
import { usePageTournament } from "@/hooks/tournaments.hook";
import useWebApp from "@/hooks/useWebApp";
import { Skeleton } from "@mui/material";
import { fromNano } from "@ton/core";
import { Page } from "konsta/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React from "react";
import { FaAngleRight } from "react-icons/fa6";

const EventImage = React.memo(() => {
  const tournament = usePageTournament();

  return (
    <Image
      width={320}
      height={320}
      className="w-full rounded-2lg"
      src={tournament.data?.imageUrl!}
      alt="event image"
    />
  );
});
EventImage.displayName = "EventImage";

const EventTicketPrice = React.memo(() => {
  const tournament = usePageTournament();

  return (
    <EventKeyValue
      label="Ticket Price"
      value={
        tournament.data?.rawHostJson?.EntryFee
          ? `${fromNano(BigInt(tournament.data.rawHostJson.EntryFee as number))}`
          : "Free"
      }
    />
  );
});
EventTicketPrice.displayName = "EventTicketPrice";

const EventAttributes = React.memo(() => {
  const tournament = usePageTournament();

  return (
    <div className="flex flex-col gap-4">
      <EventTicketPrice />
      <EventKeyValue
        label="Start Date"
        value={
          tournament.data?.startDate ? (
            <time>
              {new Date(tournament.data.startDate).toLocaleDateString("en-US", {
                day: "numeric",
                month: "short",
              })}
              {" - "}
              {new Date(tournament.data.startDate).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              })}
            </time>
          ) : (
            "TBD"
          )
        }
      />
      <EventKeyValue
        label="Duration"
        value={
          tournament.data?.startDate && tournament.data?.endDate
            ? (() => {
                const start = new Date(tournament.data.startDate);
                const end = new Date(tournament.data.endDate);
                const hours = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60));
                return `${hours} hour${hours === 1 ? "" : "s"}`;
              })()
            : "TBD"
        }
      />
      {/* <EventKeyValue
        label="Prize Distribution"
        value={"TOP 10"}
      /> */}
      <EventKeyValue
        label="Joined"
        value={tournament.data?.playersCount}
      />
    </div>
  );
});
EventAttributes.displayName = "EventAttributes";

const EventTitle = React.memo(() => {
  const tournament = usePageTournament();

  return (
    <div className="mt-4 space-y-4">
      <div className="grid grid-cols-12 items-start">
        <Typography
          variant="title2"
          weight="bold"
          className="self-center col-span-10"
        >
          {tournament.data?.name}
        </Typography>
      </div>
    </div>
  );
});
EventTitle.displayName = "EventHead";

const EventHeader = React.memo(() => {
  return (
    <CustomCard defaultPadding>
      <EventImage />

      <EventTitle />
      <Divider margin="medium" />
      <EventAttributes />
    </CustomCard>
  );
});
EventHeader.displayName = "EventHeader";

const OrganizerCard = React.memo(() => {
  const router = useRouter();
  const tournament = usePageTournament();

  return (
    <CustomCard title="Organizer">
      <div
        onClick={() => router.push(`/channels/${748891997}/`)}
        className="flex items-center justify-between cursor-pointer p-4 pt-0"
      >
        <div className="flex items-center gap-3">
          <LoadableImage
            alt="play 2 win game Organizer"
            src={tournament.data?.organizer.photo_url || "/template-images/user-placeholder.png"}
            width={48}
            height={48}
          />
          <div>
            <Typography
              variant="headline"
              weight="medium"
              className="text-primary w-52"
              truncate
            >
              {tournament.data?.organizer.org_channel_name}
            </Typography>
            <Typography
              weight="medium"
              variant="subheadline1"
              className="text-brand-muted"
            >
              {tournament.data?.organizer.hosted_event_count} events
            </Typography>
          </div>
        </div>
        <div className="flex items-center">
          <FaAngleRight className="text-primary" />
        </div>
      </div>
    </CustomCard>
  );
});
OrganizerCard.displayName = "SponsorCard";

const Play2WinPage: React.FC<{
  params: {
    "play-id": string;
  };
}> = () => {
  const tournament = usePageTournament();
  const webapp = useWebApp();

  return (
    <Page>
      {tournament.isError && <ErrorState errorCode="event_not_found" />}

      {tournament.isLoading ? (
        <div className="flex flex-col gap-4 p-4">
          {/* Event Header Skeleton */}
          <CustomCard defaultPadding>
            <Skeleton
              variant="rectangular"
              className="w-full rounded-2lg"
              height={320}
            />
            <div className="mt-4 space-y-4">
              <Skeleton
                variant="text"
                width="60%"
                height={32}
              />
              <Skeleton
                variant="text"
                width="40%"
                height={24}
              />
            </div>
            <Divider margin="medium" />
            <div className="flex flex-col gap-4">
              <Skeleton
                variant="text"
                width="50%"
              />
              <Skeleton
                variant="text"
                width="50%"
              />
              <Skeleton
                variant="text"
                width="50%"
              />
              <Skeleton
                variant="text"
                width="50%"
              />
              <Skeleton
                variant="text"
                width="50%"
              />
            </div>
          </CustomCard>

          {/* Sponsor Card Skeleton */}
          <CustomCard title="Sponsor">
            <div className="flex items-center justify-between cursor-pointer p-4 pt-0">
              <div className="flex items-center gap-3">
                <Skeleton
                  variant="circular"
                  width={48}
                  height={48}
                />
                <div>
                  <Skeleton
                    variant="text"
                    width={100}
                  />
                  <Skeleton
                    variant="text"
                    width={80}
                  />
                </div>
              </div>
              <Skeleton
                variant="circular"
                width={24}
                height={24}
              />
            </div>
          </CustomCard>
        </div>
      ) : (
        <div className="flex flex-col gap-4 p-4">
          <EventHeader />
          <OrganizerCard />
          <MainButton
            text="Play"
            onClick={() => {
              const tLink = tournament.data?.tournamentLink;
              tLink && webapp?.openTelegramLink(tLink);
              webapp?.close();
            }}
          />
        </div>
      )}
    </Page>
  );
};

export default Play2WinPage;
