"use client";

import { Button } from "@/components/ui/button";
import { useConfig } from "@/context/ConfigContext";
import { AlertTriangle, HelpCircle, Mail } from "lucide-react"; // Using lucide-react for icons
import Image from "next/image";
import React from "react";

interface FeatureGateProps {
  featureName: string;
  children: React.ReactNode;
}

export const FeatureGate: React.FC<FeatureGateProps> = ({ featureName, children }) => {
  const config = useConfig();
  const isFeatureDisabled = config && config[featureName]; // Assuming feature flag means disabled if present and truthy

  if (isFeatureDisabled) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-4 text-center bg-white dark:bg-gray-900 rounded-lg shadow-md">
        {/* Placeholder for the image, you can replace with an actual <Image /> component if you have the asset */}
        <div className="mb-6">
          <Image
            src="/placeholder-image.svg" // Replace with your actual image path
            alt="Temporarily Unavailable"
            width={200}
            height={150}
            className="opacity-75"
          />
        </div>

        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white mb-3 flex items-center">
          <AlertTriangle className="w-7 h-7 mr-2 text-yellow-500" />
          Temporarily Unavailable
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-2 max-w-md">
          Looks like this part isn&apos;t working right now. We&apos;re on it and things should be back to normal soon!
        </p>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Thanks for your patience{" "}
          <span
            role="img"
            aria-label="blue heart"
          >
            💙
          </span>
        </p>

        <div className="space-y-3 w-full max-w-xs">
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={() => console.log("Get Updates clicked")} // Replace with actual handler
          >
            <Mail className="w-5 h-5 mr-2" />
            Get Updates
          </Button>
          <Button
            variant="ghost"
            size="lg"
            className="w-full text-primary hover:bg-primary/10"
            onClick={() => console.log("Need Help? clicked")} // Replace with actual handler
          >
            <HelpCircle className="w-5 h-5 mr-2" />
            Need Help?
          </Button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-6 max-w-md">
          You will receive a notification when this page becomes available, provided you opt to get updates.
        </p>
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
