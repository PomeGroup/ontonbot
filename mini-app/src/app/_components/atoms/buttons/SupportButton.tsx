"use client";

import useWebApp from "@/hooks/useWebApp";
import { MessageSquare } from "lucide-react";
import React from "react";

const SupportButton = () => {
  const webApp = useWebApp();
  const hapticfeedback = webApp?.HapticFeedback;

  return (
    <div
      className="flex items-center justify-center text-xs text-muted-foreground"
      onClick={() => {
        hapticfeedback?.impactOccurred("medium");
        webApp?.openTelegramLink("https://t.me/ontonsupport");
      }}
    >
      Open Support Chat
      <MessageSquare className="w-3 ml-1" />
    </div>
  );
};

export default SupportButton;
