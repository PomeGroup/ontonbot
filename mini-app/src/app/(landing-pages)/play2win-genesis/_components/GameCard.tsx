// src/app/(landing-pages)/play2win-genesis/_components/GameCard.tsx
"use client";
import Typography from "@/components/Typography";
import { LucideTrophy } from "lucide-react";
import GemIcon from "./icons/GemIcon";
import TicketIcon from "./icons/TicketIcon";
import { usePlay2Win } from "./Play2WinContext";

interface KeyValueProps {
  label: string;
  value: string;
  icon: React.ReactNode;
}

function KeyValue({ label, value, icon }: KeyValueProps) {
  return (
    <div className="flex justify-between items-center">
      <Typography
        variant="footnote"
        className="flex items-center gap-1"
      >
        <span className="text-[#51AEFF]">{icon}</span>
        <span className="text-[10px]">{label}</span>
      </Typography>
      <Typography
        weight="medium"
        variant="subheadline2"
      >
        {value}
      </Typography>
    </div>
  );
}

export default function GameCard() {
  const { contest } = usePlay2Win();
  const { noGame } = contest;

  if (contest.dataFetchStatus === "loading") {
    return <div className="backdrop-blur-md h-[116px] animate-pulse bg-white/10 rounded-2lg p-2 w-full" />;
  }

  if (noGame || contest.dataFetchStatus === "error") {
    return (
      <div className="flex flex-col items-center gap-1">
        <video
          src="https://storage.onton.live/ontonvideo/event/p2w_nutrino_star.webm"
          width={98}
          height={103}
          autoPlay
          loop
          muted
          className="object-cover rounded-[122px] h-[103px]"
        />
        <Typography className="text-[13px] font-normal">No contest at the moment</Typography>
        <Typography
          variant="title3"
          weight="normal"
          className="leading-[24px]"
        >
          Next tournament starts soon!
        </Typography>
      </div>
    );
  }

  return (
    <div className="px-2 w-full">
      <div className="backdrop-blur-md bg-white/10 rounded-2lg p-2 w-full">
        <div className="flex gap-3">
          <video
            src="https://storage.onton.live/ontonvideo/event/play-2-win-video.webm"
            className="rounded-md w-25 h-25 object-cover"
            width={100}
            height={100}
            autoPlay
            loop
            muted
          />
          <div className="flex flex-col text-xs justify-center gap-2 w-full">
            <Typography
              variant="body"
              weight="normal"
              className="leading-[16px]"
            >
              {contest.gameTitle}
            </Typography>
            <div className="flex flex-col gap-1">
              <KeyValue
                icon={<TicketIcon />}
                label="Ticket price"
                value={contest.ticketPrice}
              />
              <KeyValue
                icon={<LucideTrophy size={12} />}
                label="Reward for winner"
                value={contest.reward}
              />
              <KeyValue
                icon={<GemIcon />}
                label="Points required for NFT"
                value={contest.threshold}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
