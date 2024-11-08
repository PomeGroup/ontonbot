"use client";

import { trpc } from "@/app/_trpc/client";
import { Button } from "@/components/ui/button";
import useWebApp from "@/hooks/useWebApp";
import { cn, wait } from "@/lib/utils";
import { LoaderIcon } from "lucide-react";
import { FaShare } from "react-icons/fa";

const ShareEventButton = ({ event_uuid }: { event_uuid: string }) => {
  const WebApp = useWebApp();
  const initData = WebApp?.initData || "";
  const hapticFeedback = WebApp?.HapticFeedback;

  const shareEventMutation = trpc.events.requestShareEvent.useMutation();

  return (
    <Button
      className={cn(
        "w-full flex items-center justify-center bg-gray-700 text-gray-200 hover:bg-gray-600 hover:text-gray-100 active:bg-gray-800 active:text-gray-300",

        shareEventMutation.isLoading && Boolean(initData) && "opacity-50"
      )}
      variant={"outline"}
      disabled={!initData || shareEventMutation.isLoading}
      onClick={async () => {
        if (!initData) return;

        await shareEventMutation.mutateAsync({
          eventUuid: event_uuid,
          init_data: initData,
        });

        // Add the logic for the platform or sharing link
        WebApp?.openTelegramLink(
          `https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME}`
        );
        hapticFeedback?.impactOccurred("medium");
        await wait(500);
        WebApp?.close();
      }}
    >
      <FaShare />
      <span className="text-sm ml-2">Share Event</span>
      {shareEventMutation.isLoading && (
        <LoaderIcon className="h-5 animate-spin" />
      )}
    </Button>
  );
};

export default ShareEventButton;
