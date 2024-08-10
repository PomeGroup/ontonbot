"use client";

import { trpc } from "@/app/_trpc/client";
import { Button } from "@/components/ui/button";
import useWebApp from "@/hooks/useWebApp";
import { cn, wait } from "@/lib/utils";
import { LoaderIcon } from "lucide-react";

const QrCodeButton = ({
  url,
  hub,
  event_uuid,
}: {
  event_uuid: string;
  url: string;
  hub?: string;
}) => {
  const WebApp = useWebApp();
  const initData = WebApp?.initData || "";
  const hapticFeedback = WebApp?.HapticFeedback;
  const requestSendQRcodeMutation = trpc.events.requestSendQRcode.useMutation();

  return (
    <Button
      className={cn(
        "w-full space-x-1",
        requestSendQRcodeMutation.isLoading && Boolean(initData) && "opacity-50"
      )}
      variant={"outline"}
      disabled={!initData || requestSendQRcodeMutation.isLoading}
      onClick={async () => {
        hapticFeedback?.impactOccurred("medium");

        if (!initData) return;
        await requestSendQRcodeMutation.mutateAsync({
          url,
          hub,
          init_data: initData,
          event_uuid,
        });
        WebApp?.openTelegramLink(
          `https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME}`
        );
        await wait(500);
        WebApp?.close();
      }}
    >
      <span>Get Link and QR</span>
      {requestSendQRcodeMutation.isLoading && (
        <LoaderIcon className="h-5 animate-spin" />
      )}
    </Button>
  );
};

export default QrCodeButton;
