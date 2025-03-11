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
import { Page } from "konsta/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React from "react";
import { FaAngleRight } from "react-icons/fa6";

const EventImage = React.memo(() => {
  return (
    <Image
      width={320}
      height={320}
      className="w-full rounded-2lg"
      src={
        "https://s3-alpha-sig.figma.com/img/1e4c/449e/2570818513b584eeb180eaadace966f7?Expires=1742169600&Key-Pair-Id=APKAQ4GOSFWCW27IBOMQ&Signature=EGzjtweOC4U3JDfHqwxE6wHMlvKOqJ2XFAjHkDw58Jv8kYGB-koNwkXSlevC8V0DKBalxTvtaEaja0pCtOXNe5lQaVudFzHgfkJzJdug4UcXI~0u1BSLkJ31UE0JXqEVqq2sl5NXH5WG8IL0l8Pm5SPRsbMT3FflSLqO~~MP8RE3lhXjr7L2VD9upfsb5o25iu7L2aSXY2AUfnlSF1n~rfy576w0xHVppHsJQDgHOq2l0zEVhXSjAkYFK9rJPeL7YdTElO2ODk-2awveH6P1Xu75spLEhyTus4mVv9xiTa8HpIHnW8C0YvZaCqENRGYJ0FFWxPqzzXHMAgzkbActVQ__"
      }
      alt="event image"
    />
  );
});
EventImage.displayName = "EventImage";

const EventSubtitle = React.memo(() => {
  return (
    <Typography
      variant="body"
      weight="medium"
    >
      eventData.data?.subtitle
    </Typography>
  );
});
EventSubtitle.displayName = "EventSubtitle";

const EventTicketPrice = React.memo(() => {
  return (
    <EventKeyValue
      label="Ticket Price"
      value={"Free"}
    />
  );
});
EventTicketPrice.displayName = "EventTicketPrice";

const EventAttributes = React.memo(() => {
  return (
    <div className="flex flex-col gap-4">
      <EventTicketPrice />
      <EventKeyValue
        label="Start Date"
        value={<time>{new Date().toDateString()}</time>}
      />
      <EventKeyValue
        label="Duration"
        value={"1 hour"}
      />
      <EventKeyValue
        label="Prize Distribution"
        value={"TOP 10"}
      />
      <EventKeyValue
        label="Joined"
        value={"2001"}
      />
    </div>
  );
});
EventAttributes.displayName = "EventAttributes";

const EventTitle = React.memo(() => {
  return (
    <div className="mt-4 space-y-4">
      <div className="grid grid-cols-12 items-start">
        <Typography
          variant="title2"
          weight="bold"
          className="self-center col-span-10"
        >
          eventData.data?.title
        </Typography>
      </div>
      <EventSubtitle />
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

const SponsorCard = React.memo(() => {
  const router = useRouter();
  const tournament = usePageTournament();

  return (
    <CustomCard title="Sponsor">
      <div
        onClick={() => router.push(`/channels/${748891997}/`)}
        className="flex items-center justify-between cursor-pointer p-4 pt-0"
      >
        <div className="flex items-center gap-3">
          <LoadableImage
            alt="play 2 win game sponsor"
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
SponsorCard.displayName = "SponsorCard";

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
          <SponsorCard />
          <MainButton
            text="Play"
            onClick={() => {
              const tLink = tournament.data?.tournamentLink;
              tLink && webapp?.openTelegramLink(tLink);
            }}
          />
        </div>
      )}
    </Page>
  );
};

export default Play2WinPage;
