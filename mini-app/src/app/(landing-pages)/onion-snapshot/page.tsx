"use client";

import CustomCard from "@/app/_components/atoms/cards/CustomCard";
import Typography from "@/components/Typography";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

const OnionSnapshotPage = () => {
  return (
    <div className="bg-brand-bg p-4 flex flex-col gap-4 min-h-screen">
      <CustomCard
        defaultPadding
        className="flex flex-col items-center gap-3 text-center w-full"
      >
        <Typography
          weight="bold"
          variant="title1"
        >
          ONION is Coming!
        </Typography>

        <Image
          src="https://storage.onton.live/ontonimage/onion-image-croped.png"
          width={280}
          height={143}
          alt="ONION"
          className="mx-auto"
        />

        <Typography variant="callout">And You may be eligible for a token airdrop!</Typography>
      </CustomCard>

      {/* Card Section */}
      <CustomCard
        defaultPadding
        className="text-center h-auto"
      >
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Typography variant="callout">Let&apos;s find out how much you&apos;ve earned</Typography>

            <Link
              href="/onion-snapshot/check-status"
              className="w-full"
            >
              <Button
                variant="primary"
                size="lg"
                className="w-full"
              >
                <span
                  role="img"
                  aria-label="magnifying glass"
                  className="mr-2 text-xl"
                >
                  🔍
                </span>
                Check My Status
              </Button>
            </Link>
          </div>

          <div className="flex flex-col gap-2">
            <Typography variant="callout">You can also:</Typography>

            <Button
              variant="info"
              size="lg"
              className="w-full"
            >
              <span
                role="img"
                aria-label="rocket"
                className="mr-2 text-xl"
              >
                🚀
              </span>
              Boost Your Score
            </Button>
          </div>

          <div className="flex flex-col gap-2">
            <Typography variant="callout">Check:</Typography>

            <Link
              href="/onion-snapshot/important-dates"
              className="w-full"
            >
              <Button
                variant="info"
                size="lg"
                className="w-full"
              >
                <span
                  role="img"
                  aria-label="calendar"
                  className="mr-2 text-xl"
                >
                  🗓️
                </span>
                Important Dates
              </Button>
            </Link>
          </div>

          <div className="flex flex-col gap-2">
            <Typography variant="callout">And know:</Typography>

            <Link
              href="/onion-snapshot/what-is-onion"
              className="w-full"
            >
              <Button
                variant="info"
                size="lg"
                className="w-full"
              >
                <span
                  role="img"
                  aria-label="onion"
                  className="mr-2 text-xl"
                >
                  🧅
                </span>
                What is ONION?
              </Button>
            </Link>
          </div>
        </div>
      </CustomCard>
    </div>
  );
};

export default OnionSnapshotPage;
