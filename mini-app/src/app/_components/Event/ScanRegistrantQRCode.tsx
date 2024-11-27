import { trpc } from "@/app/_trpc/client";
import useWebApp from "@/hooks/useWebApp";
import { Preloader } from "konsta/react";
import { ScanLine } from "lucide-react";
import { useParams } from "next/navigation";
import React from "react";
import { toast } from "sonner";

const ScanRegistrantQRCode = () => {
  const params = useParams<{ hash: string }>();
  const webApp = useWebApp();

  // TRPC
  const checkInRegistrant = trpc.events.checkinRegistrantRequest.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      webApp?.showPopup(
        {
          title: "Check-In Success ✅",
          message: data.message,
          buttons: [
            {
              type: "close",
              id: "close",
            },
            {
              text: "Check-In Next",
              type: "default",
            },
          ],
        },
        (id) => {
          if (id === "close") {
            webApp.closeScanQrPopup();
          }
        }
      );
    },
    onError: (error) => {
      webApp?.closeScanQrPopup();
      toast.error(error.message);
    },
  });

  return checkInRegistrant.isLoading ? (
    <Preloader />
  ) : (
    <ScanLine
      onClick={() =>
        webApp?.showScanQrPopup(
          {
            text: "Check-In Registrant",
          },
          (registrant_uuid) => {
            checkInRegistrant.mutate({ event_uuid: params.hash, registrant_uuid });
          }
        )
      }
      className="text-primary bg-primary/10 rounded"
    />
  );
};

export default ScanRegistrantQRCode;
