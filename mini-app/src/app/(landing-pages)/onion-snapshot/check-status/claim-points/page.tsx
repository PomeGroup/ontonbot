"use client";
import CustomCard from "@/app/_components/atoms/cards/CustomCard";
import CustomSheet from "@/app/_components/Sheet/CustomSheet";
import Typography from "@/components/Typography";
import { Button } from "@/components/ui/button";

function OnionStockBanner() {
  return (
    <div className="rounded-lg bg-gradient-to-br from-[#FFAE6E] to-[#F36A00] opacity-60 border shadow-inner backdrop-blur-sm flex flex-col justify-center items-center gap-4 py-4 w-full">
      <div className="flex flex-col gap-2">
        <div className="font-medium text-[13px] leading-[1.38] text-center text-white tracking-tightest">
          Your Current Stock is
        </div>
        <div className="font-bold text-3xl leading-tight text-center text-white tracking-tighter">? ONIONs</div>
      </div>
    </div>
  );
}

function SnapshotResultCard() {
  return (
    <CustomCard
      className="flex flex-col gap-4 p-5 rounded-[10px]"
      defaultPadding={false}
    >
      <Typography
        variant="title3"
        className="text-center text-black"
      >
        Snapshot Result
      </Typography>
      <div className="h-[1px] bg-[#EFEFF4] w-full"></div>
      <div className="flex flex-col gap-2 w-full">
        {/* Row 1 */}
        <div className="flex gap-2 w-full">
          {/* ONION NFTs */}
          <div className="flex flex-col items-center gap-2 p-4 rounded-[10px] bg-[#EFEFF4]/50 flex-1">
            {/* Icon Placeholder */}
            <img
              src="https://storage.onton.live/ontonimage/gem_nft_onions_icon.svg"
              alt="ONION NFTs icon"
              className="w-[60px] h-[60px]"
            />
            <Typography
              variant="subheadline1"
              className="text-center text-[#575757]"
            >
              ONION NFTs
            </Typography>
          </div>
          {/* Referral */}
          <div className="flex flex-col items-center gap-2 p-4 rounded-[10px] bg-[#EFEFF4]/50 flex-1">
            {/* Icon Placeholder */}
            <img
              src="https://storage.onton.live/ontonimage/referral_onions_icon.svg"
              alt="Referral icon"
              className="w-[60px] h-[60px]"
            />
            <Typography
              variant="subheadline1"
              className="text-center text-[#575757]"
            >
              Referral
            </Typography>
          </div>
        </div>
        {/* Row 2 */}
        <div className="flex gap-2 w-full">
          {/* Event Creation */}
          <div className="flex flex-col items-center gap-2 p-4 rounded-[10px] bg-[#EFEFF4]/50 flex-1">
            {/* Icon Placeholder */}
            <img
              src="https://storage.onton.live/ontonimage/calendar_onions_icon.svg"
              alt="Event Creation icon"
              className="w-[60px] h-[60px]"
            />
            <Typography
              variant="subheadline1"
              className="text-center text-[#575757]"
            >
              Event Creation
            </Typography>
          </div>
          {/* Event Attendance */}
          <div className="flex flex-col items-center gap-2 p-4 rounded-[10px] bg-[#EFEFF4]/50 flex-1">
            {/* Icon Placeholder */}
            <img
              src="https://storage.onton.live/ontonimage/ticket_onions_icon.svg"
              alt="Event Attendance icon"
              className="w-[60px] h-[60px]"
            />
            <Typography
              variant="subheadline1"
              className="text-center text-[#575757]"
            >
              Event Attendance
            </Typography>
          </div>
        </div>
      </div>
    </CustomCard>
  );
}

function OnionBenefitsCard() {
  return (
    <div className="flex flex-col gap-2 p-3 rounded-[10px] bg-[#EFEFF4]/50">
      <Typography
        variant="subheadline1"
        className="text-black font-normal leading-tight tracking-tighter text-sm"
      >
        Use ONION, the governance token, to enable:
      </Typography>
      <ul className="list-disc list-inside flex flex-col gap-1">
        <li className="text-black font-normal leading-snug tracking-tight text-xs">
          <Typography
            variant="footnote"
            className="inline text-black font-normal leading-snug tracking-tight text-xs"
          >
            Event discounts, staking yields, and access to community events.
          </Typography>
        </li>
        <li className="text-black font-normal leading-snug tracking-tight text-xs">
          <Typography
            variant="footnote"
            className="inline text-black font-normal leading-snug tracking-tight text-xs"
          >
            Participation airdrops reward community contributors.
          </Typography>
        </li>
        <li className="text-black font-normal leading-snug tracking-tight text-xs">
          <Typography
            variant="footnote"
            className="inline text-black font-normal leading-snug tracking-tight text-xs"
          >
            DAO governance enhances decision-making with SBT-weighted voting for fair representation.
          </Typography>
        </li>
      </ul>
    </div>
  );
}

function ClaimPointsModal() {
  return (
    <CustomSheet
      opened
      title="Onions"
      centerTitle
      hideClose
    >
      <div className="flex flex-col gap-4">
        <OnionBenefitsCard />
        <Button
          variant="primary"
          className="w-full"
        >
          Close
        </Button>
      </div>
    </CustomSheet>
  );
}

export default function ClaimPointsPage() {
  return (
    <div className="flex flex-col gap-4 py-6 px-4">
      <OnionStockBanner />
      <SnapshotResultCard />
      <p className="text-center text-black">
        You can easily Claim the ONIONs you’ve earned during the snapshot phase. It’s a great way to see what you’ve
        accumulated!
      </p>
      <Button
        variant="primary"
        size="lg"
      >
        Claim Now
      </Button>
      <ClaimPointsModal />
    </div>
  );
}
