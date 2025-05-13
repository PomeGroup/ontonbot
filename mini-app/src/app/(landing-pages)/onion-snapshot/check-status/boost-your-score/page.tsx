"use client";

import CustomCard from "@/app/_components/atoms/cards/CustomCard";
import OntonIcon from "@/app/_components/icons/onton-icon";
import { trpc } from "@/app/_trpc/client";
import Typography from "@/components/Typography";
import { Button } from "@/components/ui/button";

const BoostYourScorePage = () => {
  const totalPointsQuery = trpc.usersScore.getTotalScoreByUserId.useQuery();

  return (
    <div className="bg-[#EFEFF4] min-h-screen p-4 flex flex-col gap-4">
      <div className="flex flex-col items-center gap-2 text-center mb-2">
        <Typography
          variant="title1"
          weight="bold"
        >
          Boost Your Score
        </Typography>
        <Typography
          variant="footnote"
          className="text-center px-4"
        >
          Earn more ONIONs by growing your ONTON points
        </Typography>
      </div>

      {/* Points card */}
      <div className="flex flex-col items-center justify-center bg-white rounded-lg p-3 gap-2">
        <div className="flex items-center gap-6 bg-white p-2 rounded-lg">
          <div className="flex items-center gap-2">
            <OntonIcon />
            <div className="flex flex-col">
              <Typography variant="headline">
                {totalPointsQuery.isLoading
                  ? "Loading..."
                  : totalPointsQuery.error
                    ? "Error loading points"
                    : (totalPointsQuery.data ?? 0)}
              </Typography>
              <Typography variant="caption1">ONTON points</Typography>
            </div>
          </div>
        </div>
        <div className="flex flex-col w-full border-t border-[#C8C7CB] pt-2">
          <div className="flex items-center gap-1 justify-center">
            <Typography
              variant="footnote"
              weight="semibold"
            >
              Top 10%
            </Typography>
            <Typography variant="caption1">of community</Typography>
          </div>
        </div>
      </div>

      {/* Join Events Card */}
      <CustomCard
        defaultPadding
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col gap-1 w-full">
          <Typography
            variant="headline"
            weight="normal"
          >
            Join Events
          </Typography>
          <Typography
            variant="footnote"
            weight="semibold"
          >
            Attend online or offline events to collect SBTs and earn points
          </Typography>
        </div>
        <Button
          variant="primary"
          size="lg"
          className="w-full bg-[#007AFF] text-white"
        >
          Explore Events
        </Button>
      </CustomCard>

      {/* Organize Events Card */}
      <CustomCard
        defaultPadding
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col gap-1 w-full">
          <Typography
            variant="headline"
            weight="regular"
          >
            Organize Events
          </Typography>
          <Typography
            variant="footnote"
            weight="semibold"
          >
            Get extra points when others claim your event's SBT.
          </Typography>
        </div>
        <Button
          variant="primary"
          size="lg"
          className="w-full bg-[#007AFF] text-white"
        >
          Create an Event
        </Button>
      </CustomCard>

      {/* Invite Friends Card */}
      <CustomCard
        defaultPadding
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col gap-1 w-full">
          <Typography
            variant="headline"
            weight="normal"
          >
            Invite Friends
          </Typography>
          <Typography
            variant="footnote"
            weight="semibold"
          >
            Earn +0.2 points for every friend you incite who starts ONTON.
          </Typography>
        </div>

        {/* Referral link box */}
        <div className="w-full bg-[#EEEEF0] rounded-lg">
          <div className="flex justify-between items-center p-4 border-b border-[rgba(84,84,86,0.34)]">
            <Typography
              variant="body"
              weight="normal"
              className="opacity-40"
            >
              https://t.me/ontonbot/jd7w9h
            </Typography>
          </div>
        </div>

        {/* Button group */}
        <div className="flex gap-2 w-full">
          <Button
            variant="primary"
            size="lg"
            className="bg-[#007AFF] text-white"
          >
            Copy Link
          </Button>
          <Button
            variant="primary"
            size="lg"
            className="w-full bg-[#007AFF] text-white"
          >
            Share to Telegram
          </Button>
        </div>
      </CustomCard>
    </div>
  );
};

export default BoostYourScorePage;
