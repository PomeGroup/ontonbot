"use client";
import Typography from "@/components/Typography";
import { LucideTrophy } from "lucide-react";
import GemIcon from "./icons/GemIcon";
import TicketIcon from "./icons/TicketIcon";

interface KeyValueProps {
  label: string;
  value: string;
  icon: React.ReactNode;
}

function KeyValue({ label, value, icon }: KeyValueProps) {
  return (
    <div className="flex justify-between items-center">
      <Typography
        variant="caption2"
        className="flex items-center gap-1"
      >
        <span className="text-[#51AEFF]">{icon}</span>
        <span className="text-sm">{label}</span>
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

/**
 * GameCard component displays a game card with details such as the game image, title,
 * ticket price in TON, trophy reward in dollars, and an experience points threshold.
 *
 * This component is used on the play2win-genesis landing page to showcase individual games.
 *
 * @component
 * @example
 * return (
 *   <GameCard />
 * )
 */
export default function GameCard() {
  const noGame = true;

  if (noGame) {
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
        <Typography className="text-[20px] font-normal leading-[24px]">Next tournament starts soon!</Typography>
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
              Sweet Rush
            </Typography>
            <div className="flex flex-col gap-1">
              <KeyValue
                icon={<TicketIcon />}
                label="Ticket price"
                value="0.5 TON"
              />
              <KeyValue
                icon={<LucideTrophy size={12} />}
                label="Reward for winner"
                value="$150"
              />
              <KeyValue
                icon={<GemIcon />}
                label="Threshold for NFT"
                value=">1500 xp"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
