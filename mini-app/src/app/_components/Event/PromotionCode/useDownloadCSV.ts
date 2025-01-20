import { trpc } from "@/app/_trpc/client";
import { useState } from "react";
import { telegramInteractionsRouter } from "@/server/routers/telegramInteractions";
import { wait } from "@/lib/utils";
import useWebApp from "@/hooks/useWebApp";

export function useDownloadCSV() {
  // local state to track “loading” (disable menu, show "Loading CSV file...")
  const [isCSVLoading, setIsCSVLoading] = useState(false);
  const WebApp = useWebApp();

  // define the tRPC mutation
  const csvMutation = trpc.telegramInteractions.getCouponItemsCSV.useMutation({
    onSuccess: () => {
      // once the server has triggered the CSV file send,
      // close the mini app or do something
      // e.g. if you have webApp:
      // webApp?.close();
      setIsCSVLoading(false);
    },
    onError: (err) => {
      console.error("Failed to get CSV:", err);
      setIsCSVLoading(false);
    },
  });

  // the function to be called from your 3-dot menu "Download" item
  async function handleDownloadCSV(defId: number, eventUuid: string) {
    setIsCSVLoading(true);
    csvMutation.mutate({
      coupon_definition_id: defId,
      event_uuid: eventUuid,
    });
    // Add the logic for the platform or sharing link
    WebApp?.openTelegramLink(`https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME}`);
    const hapticFeedback = WebApp?.HapticFeedback;
    hapticFeedback?.impactOccurred("medium");
    await wait(500);
    WebApp?.close();
  }

  return {
    isCSVLoading,
    handleDownloadCSV,
  };
}
