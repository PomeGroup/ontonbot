"use client";

import CustomCard from "@/app/_components/atoms/cards/CustomCard";
import OntonIcon from "@/app/_components/icons/onton-icon";
import DataStatus from "@/app/_components/molecules/alerts/DataStatus";
import Typography from "@/components/Typography";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const BoostYourScorePage = () => {
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
          Maximize your ONION airdrop by completing actions below. Each action increases your points and airdrop share!
        </Typography>
      </div>

      {/* Example: Action Card 1 */}
      <CustomCard
        defaultPadding
        className="flex flex-col gap-4"
      >
        <div className="flex items-center gap-3">
          <OntonIcon />
          <div className="flex flex-col">
            <Typography
              variant="title3"
              weight="bold"
            >
              Join Events
            </Typography>
            <Typography variant="footnote">Participate in ONTON events to earn more points.</Typography>
          </div>
        </div>
        <Button
          variant="primary"
          size="lg"
          className="w-full bg-[#007AFF] text-white"
        >
          View Events
        </Button>
      </CustomCard>

      {/* Example: Action Card 2 */}
      <CustomCard
        defaultPadding
        className="flex flex-col gap-4"
      >
        <div className="flex items-center gap-3">
          <OntonIcon />
          <div className="flex flex-col">
            <Typography
              variant="title3"
              weight="bold"
            >
              Refer Friends
            </Typography>
            <Typography variant="footnote">Invite friends to ONTON and boost your score together.</Typography>
          </div>
        </div>
        <Button
          variant="primary"
          size="lg"
          className="w-full bg-[#007AFF] text-white"
        >
          Get Referral Link
        </Button>
      </CustomCard>

      {/* Example: Action Card 3 */}
      <CustomCard
        defaultPadding
        className="flex flex-col gap-4"
      >
        <div className="flex items-center gap-3">
          <OntonIcon />
          <div className="flex flex-col">
            <Typography
              variant="title3"
              weight="bold"
            >
              Merge NFTs
            </Typography>
            <Typography variant="footnote">Merge your NFTs for platinum and increase your multiplier.</Typography>
          </div>
        </div>
        <Button
          variant="primary"
          size="lg"
          className="w-full bg-[#007AFF] text-white"
        >
          Merge Now
        </Button>
      </CustomCard>

      {/* Example: DataStatus sticker for motivation */}
      <DataStatus
        status="success"
        title={
          <Typography
            variant="headline"
            weight="bold"
          >
            Keep Boosting!
          </Typography>
        }
        description={<Typography variant="footnote">The more you participate, the bigger your ONION drop!</Typography>}
        size="md"
        className="mt-6"
      />

      {/* Back to status page */}
      <Link
        href="/onion-snapshot/check-status"
        className="w-full mt-4"
      >
        <Button
          variant="outline"
          size="lg"
          className="w-full"
        >
          ← Back to Status
        </Button>
      </Link>
    </div>
  );
};

export default BoostYourScorePage;
