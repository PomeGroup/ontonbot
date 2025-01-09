import { trpc } from "@/app/_trpc/client";
import useWebApp from "@/hooks/useWebApp";
import { Preloader } from "konsta/react";
import { ScanLine } from "lucide-react";
import { useParams } from "next/navigation";
import React from "react";

const ScanRegistrantQRCode = () => {
  const params = useParams<{ hash: string }>();
  const webApp = useWebApp();

  // TRPC
  const checkInRegistrant = trpc.registrant.checkinRegistrantRequest.useMutation({
    onSuccess: (data) => {
      webApp?.showPopup({
        title: "Check-In Success ✅",
        message: data.message,
      });
    },
    onError: (error) => {
      webApp?.showPopup({
        title: "Check-In Failed ❌",
        message: error.message,
      });
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
