"use client";

import CustomCard from "@/app/_components/atoms/cards/CustomCard";
import Typography from "@/components/Typography";
import { Button } from "@/components/ui/button";
import { useConfigDate } from "@/hooks/useConfigDate";
import Image from "next/image";

const ImportantDates = () => {
  const timeLeft = useConfigDate("campeign_merge_date");

  return (
    <div className="bg-brand-bg p-4 flex flex-col gap-4 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col items-center gap-2 text-center w-full">
        <Typography
          weight="bold"
          variant="title1"
        >
          Important Dates
        </Typography>
        <Typography
          className="font-normal"
          variant="callout"
        >
          Don&apos;t miss your ONION Rewards
        </Typography>
      </div>

      {/* Snapshot Date Card */}
      <CustomCard defaultPadding>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex gap-2 items-start">
              <div className="h-10 w-10">
                <Image
                  src="/images/snapshot.svg"
                  width={40}
                  height={40}
                  alt="Calendar"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Typography variant="title3">Snapshot Date</Typography>
                <Typography
                  variant="footnote"
                  weight="medium"
                >
                  May 15, 2025
                </Typography>
              </div>
            </div>
            <Typography
              variant="footnote"
              weight="medium"
            >
              Your points and NFTs will be locked-in while in the reward distribution period.
            </Typography>
          </div>
          <div className="flex items-center justify-center gap-1 bg-brand-bg py-1">
            <span className="text-xl">⏳</span>
            <Typography
              variant="title2"
              weight="bold"
            >
              {timeLeft.days}
            </Typography>
            <Typography
              variant="subheadline1"
              weight="semibold"
            >
              Days Left
            </Typography>
          </div>
          <Button
            variant="primary"
            size="lg"
            className="w-full"
          >
            Check Status
          </Button>
        </div>
      </CustomCard>

      {/* Claim Portal Opens Card */}
      <CustomCard defaultPadding>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex gap-2 items-start">
              <div className="h-10 w-10">
                <Image
                  src="/images/gift-icon.svg"
                  width={40}
                  height={40}
                  alt="Calendar"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Typography variant="title3">Claim Portal Opens</Typography>
                <Typography
                  variant="footnote"
                  weight="medium"
                >
                  July 10, 2025
                </Typography>
              </div>
            </div>
            <Typography
              variant="footnote"
              weight="medium"
            >
              Use / Claim to receive your ONION tokens.
            </Typography>
          </div>
          <div className="flex items-center justify-center gap-1 bg-[#EFEFF4] py-1">
            <span className="text-xl">⏳</span>
            <Typography
              variant="subheadline1"
              weight="semibold"
            >
              Not yet open
            </Typography>
          </div>
        </div>
      </CustomCard>

      {/* DAO Voting Begins Card */}
      <CustomCard defaultPadding>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex gap-2 items-start">
              <div className="h-10 w-10">
                <Image
                  src="/images/voting-icon.svg"
                  width={40}
                  height={40}
                  alt="Calendar"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Typography variant="title3">DAO Voting Begins</Typography>
                <Typography
                  variant="footnote"
                  weight="medium"
                >
                  July 12, 2025
                </Typography>
              </div>
            </div>
            <Typography
              variant="footnote"
              weight="medium"
            >
              Start voting using your ONIONs in ONIONVerse DAO to be a part of decisions.
            </Typography>
          </div>
          <div className="flex items-center justify-center gap-1 bg-[#EFEFF4] py-1">
            <span className="text-xl">⏳</span>
            <Typography
              variant="subheadline1"
              weight="semibold"
            >
              Not yet open
            </Typography>
          </div>
        </div>
      </CustomCard>
    </div>
  );
};

export default ImportantDates;
