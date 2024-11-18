"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useBackButton, useMiniApp } from "@tma.js/sdk-react";

type EventMainButtonProps = {
  ticketId: string;
};

const TicketTmaSettings = ({ ticketId }: EventMainButtonProps) => {
  const backButton = useBackButton(true);
  const tma = useMiniApp(true);
  const router = useRouter();

  useEffect(() => {
    backButton?.on("click", () => {
      router.push(`/ticket/${ticketId}`);
    });

    backButton?.show();

    return () => {
      backButton?.hide();
    };
  }, [backButton?.isVisible]);

  useEffect(() => {
    tma?.setBgColor("#f0f0f0");
    tma?.setHeaderColor("#EFEFF4");
  }, [tma?.bgColor]);

  return <></>;
};

export default TicketTmaSettings;
