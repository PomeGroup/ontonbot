"use client";

import { trpc } from "@/app/_trpc/client";
import { Button } from "@/components/ui/button";
import useWebApp from "@/hooks/useWebApp";
import { cn, wait } from "@/lib/utils";
import { LoaderIcon, QrCode } from "lucide-react";

const QrCodeButton = ({ url, hub, event_uuid }: { event_uuid: string; url: string; hub?: string }) => {
  const WebApp = useWebApp();
  const initData = WebApp?.initData || "";
  const hapticFeedback = WebApp?.HapticFeedback;
  const requestSendQRCodeMutation = trpc.telegramInteractions.requestSendQRCode.useMutation();

  return (
    <Button
      className={cn(
        "w-full text-sm xs:text-md space-x-2 mb-4 mt-2",
        requestSendQRCodeMutation.isLoading && Boolean(initData) && "opacity-50"
      )}
      variant={"secondary"}
      disabled={!initData || requestSendQRCodeMutation.isLoading}
      onClick={async () => {
        if (!initData) return;
        await requestSendQRCodeMutation.mutateAsync({
          url,
          hub,
          event_uuid,
        });
        WebApp?.openTelegramLink(`https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME}`);
        hapticFeedback?.impactOccurred("medium");
        await wait(500);
        WebApp?.close();
      }}
    >
      <QrCode />
      <span>Get Event Link and QR</span>
      {requestSendQRCodeMutation.isLoading && <LoaderIcon className="h-5 animate-spin" />}
    </Button>
  );
};

export default QrCodeButton;
