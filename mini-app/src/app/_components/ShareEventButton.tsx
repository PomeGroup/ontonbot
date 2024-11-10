"use client";

import { trpc } from "@/app/_trpc/client";
import useWebApp from "@/hooks/useWebApp";
import { cn, wait } from "@/lib/utils";
import { LoaderIcon } from "lucide-react";
import { PiShareFatBold } from "react-icons/pi";

const ShareEventButton = ({ event_uuid }: { event_uuid: string }) => {
  const WebApp = useWebApp();
  const initData = WebApp?.initData || "";
  const hapticFeedback = WebApp?.HapticFeedback;

  const shareEventMutation = trpc.events.requestShareEvent.useMutation();

  return (
    <button
      className={cn(
        "rounded-full bg-blue-100 p-2",
        shareEventMutation.isLoading && Boolean(initData) && "opacity-50"
      )}
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
      {shareEventMutation.isLoading ? (
        <LoaderIcon className="animate-spin text-blue-600" />
      ) : <PiShareFatBold className="text-blue-600" />
      }
    </button>
  );
};

export default ShareEventButton;


