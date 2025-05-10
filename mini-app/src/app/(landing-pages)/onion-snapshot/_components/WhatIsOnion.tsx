"use client";

import CustomCard from "@/app/_components/atoms/cards/CustomCard";
import Typography from "@/components/Typography";
import { Button } from "@/components/ui/button";

const WhatIsOnion = () => {
  return (
    <div className="bg-brand-bg p-4 flex flex-col gap-4 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col items-center gap-2 w-full">
        <Typography
          weight="bold"
          variant="title1"
          className="text-center text-[28px]"
        >
          What is ONION?
        </Typography>
        <Typography
          variant="body"
          className="text-center text-[13px]"
        >
          Don&apos;t miss your ONION Rewards
        </Typography>
      </div>

      {/* Governance & DAO Card */}
      <CustomCard
        defaultPadding
        className="w-full"
      >
        <div className="flex flex-col gap-1">
          <Typography
            variant="title3"
            className="text-[20px]"
          >
            🗳 Governance & DAO
          </Typography>
          <Typography
            variant="subheadline1"
            className="font-semibold text-[14px]"
          >
            ONION lets you vote on how the ecosystem evolves. Proposals, grants, treasure usage - all decided by holders.
          </Typography>
        </div>
      </CustomCard>

      {/* Airdrop-Based Launch Card */}
      <CustomCard
        defaultPadding
        className="w-full"
      >
        <div className="flex flex-col gap-1">
          <Typography
            variant="title3"
            className="text-[20px]"
          >
            🪂 Airdrop-Based Launch
          </Typography>
          <Typography
            variant="subheadline1"
            className="font-semibold text-[14px]"
          >
            No VCs. No team allocation. Just community. Tokens are distributed based on your on-chain reputation.
          </Typography>
        </div>
      </CustomCard>

      {/* Use Cases Card */}
      <CustomCard
        defaultPadding
        className="w-full"
      >
        <div className="flex flex-col gap-1">
          <Typography
            variant="title3"
            className="text-[20px]"
          >
            🔐 Use Cases
          </Typography>
          <Typography
            variant="subheadline1"
            className="font-semibold text-[14px]"
          >
            Stake ONION → Earn yield + voting power
          </Typography>
          <Typography
            variant="subheadline1"
            className="font-semibold text-[14px]"
          >
            Hold ONION → Access partner events, drops, and sales
          </Typography>
          <Typography
            variant="subheadline1"
            className="font-semibold text-[14px]"
          >
            Boost Points → Earn more ONION each season
          </Typography>
        </div>
      </CustomCard>

      {/* How It Works Card */}
      <CustomCard
        defaultPadding
        className="w-full"
      >
        <div className="flex flex-col gap-1">
          <Typography
            variant="title3"
            className="text-[20px]"
          >
            🧠 How It Works
          </Typography>
          <Typography
            variant="subheadline1"
            className="font-semibold text-[14px]"
          >
            You earn ONTON Points through events and referrals.
          </Typography>
          <Typography
            variant="subheadline1"
            className="font-semibold text-[14px]"
          >
            Points = ONIONs (snapshot on May 15, Claim begins at July 10)
          </Typography>
        </div>
      </CustomCard>

      {/* Know More Card */}
      <CustomCard
        defaultPadding
        className="w-full"
      >
        <div className="flex flex-col gap-4">
          <Typography
            variant="title3"
            className="text-[20px]"
          >
            Know More
          </Typography>

          <Button
            variant="info"
            size="lg"
            className="w-full bg-[#E5F2FF] h-[50px] text-[17px] font-semibold"
          >
            📄 Read Litepaper
          </Button>

          <Button
            variant="info"
            size="lg"
            className="w-full bg-[#E5F2FF] h-[50px] text-[17px] font-semibold"
          >
            📚 Visit Docs
          </Button>

          <Button
            variant="info"
            size="lg"
            className="w-full bg-[#E5F2FF] h-[50px] text-[17px] font-semibold"
          >
            🎥 Watch Explainer Video
          </Button>
        </div>
      </CustomCard>
    </div>
  );
};

export default WhatIsOnion;
