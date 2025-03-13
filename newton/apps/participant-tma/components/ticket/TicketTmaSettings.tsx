"use client";

import { useBackButton, useMainButton, useMiniApp } from "@tma.js/sdk-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

type EventMainButtonProps = {
  ticketId: string;
  orderUuid: string;
  eventId: string;
};

const TicketTmaSettings = ({ ticketId, orderUuid, eventId }: EventMainButtonProps) => {
  const mainButton = useMainButton(true);
  const backButton = useBackButton(true);

  const tma = useMiniApp(true);
  const router = useRouter();
  useEffect(() => {
    mainButton?.hideLoader();

    mainButton?.setBgColor("#007AFF");
    mainButton?.setTextColor("#ffffff").setText("Check-in");
    mainButton?.enable().show();

    router.prefetch(`/ticket/${ticketId}/qrcode`);
    mainButton?.on("click", () => {
      router.push(`/ticket/${ticketId}/qrcode?orderUuid=${orderUuid}`);
    });

    return () => {
      mainButton?.hide().disable();
    };
  }, [mainButton?.isVisible]);

  useEffect(() => {
    backButton?.on("click", () => {
      router.push(`/event/${eventId}`);
    });

    backButton?.show();

    return () => {
      backButton?.hide();
    };
  }, [backButton?.isVisible]);

  useEffect(() => {
    tma?.setBgColor("#ffffff");
    tma?.setHeaderColor("#ffffff");
  }, [tma?.bgColor]);

  return <></>;
};

export default TicketTmaSettings;
