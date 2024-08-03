"use client";

import useWebApp from "@/hooks/useWebApp";
import { MessageSquare } from "lucide-react";
import React from "react";

const SupportButton = () => {
  const webApp = useWebApp();
  const hapticfeedback = webApp?.HapticFeedback;

  return (
    <div
      className="flex items-center justify-center text-[14px] text-secondary"
      onClick={() => {
        hapticfeedback?.impactOccurred("medium");
        webApp?.openTelegramLink("https://t.me/ontonsupport");
      }}
    >
      Support
      <MessageSquare className="w-[14px] text-secondary ml-1" />
    </div>
  );
};

export default SupportButton;
