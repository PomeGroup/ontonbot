"use client";

import Typography from "@/components/Typography";
import DateCard from "./DateCard";

const ImportantDates = () => {
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
      <DateCard
        iconSrc="/images/snapshot.svg"
        title="Snapshot Date"
        endDateKey="snapshot_date"
        link="/onion-snapshot/check-status"
        linkText="Check Status"
        showCountdown={true}
      />

      {/* Claim Portal Opens Card */}
      <DateCard
        iconSrc="/images/gift-icon.svg"
        title="Claim Portal Opens"
        endDateKey="snapshot_claim_date"
        link="https://onion.tg/docs/"
      />

      {/* DAO Voting Begins Card */}
      <DateCard
        iconSrc="/images/voting-icon.svg"
        title="DAO Voting Begins"
        endDateKey="snapshot_voting_date"
      />
    </div>
  );
};

export default ImportantDates;
