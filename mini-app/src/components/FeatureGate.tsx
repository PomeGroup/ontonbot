"use client";

import DataStatus from "@/app/_components/molecules/alerts/DataStatus";
import { Button } from "@/components/ui/button";
import { useConfig } from "@/context/ConfigContext";
import React from "react";
import Typography from "./Typography";

interface FeatureGateProps {
  featureName: string;
  children: React.ReactNode;
}

export const FeatureGate: React.FC<FeatureGateProps> = ({ featureName, children }) => {
  const config = useConfig();
  const isFeatureDisabled = config && config[featureName]; // Assuming feature flag means disabled if present and truthy

  if (isFeatureDisabled) {
    return (
      <div className="flex flex-col gap-6 items-center justify-center max-w-md p-4 text-center bg-white">
        <div className="">
          <DataStatus
            status="temp_unavailable"
            size="lg"
          />
        </div>

        <div className="flex flex-col gap-1">
          <Typography variant="title2">🚧 Temporarily Unavailable</Typography>
          <Typography
            variant="callout"
            className="text-balance font-normal"
          >
            Looks like this part isn&apos;t working right now. We&apos;re on it and things should be back to normal soon!
          </Typography>

          <Typography
            variant="callout"
            className="text-balance font-normal"
          >
            Thanks for your patience 💙
          </Typography>
        </div>

        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={() => console.log("Get Updates clicked")}
          >
            Get Updates
          </Button>
          <Button
            variant="info"
            size="lg"
            onClick={() => console.log("Need Help? clicked")}
            className="w-full"
          >
            Need Help?
          </Button>
          <Typography
            variant="footnote"
            className="font-normal text-balance max-w-md"
          >
            You will receive a notification when this page becomes available, provided you opt to get updates.
          </Typography>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// Basic SVG placeholder to make the component runnable
// You should replace src="/placeholder-image.svg" with the actual path to your image
// and ensure the SVG file exists at public/placeholder-image.svg if you use this.
/*
Create a file public/placeholder-image.svg with the following content:
<svg width="200" height="150" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 150" fill="none">
  <rect width="200" height="150" rx="12" fill="#E0E0E0"/>
  <path d="M60 110 L80 70 L100 100 L120 60 L140 110" stroke="#A0A0A0" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="140" cy="50" r="10" fill="#A0A0A0"/>
  <rect x="50" y="40" width="30" height="20" fill="#B0B0B0"/>
  <rect x="120" y="30" width="40" height="30" fill="#B0B0B0"/>
</svg>
*/

export default FeatureGate;
