"use client";

import { useEffect } from "react";
import { useMiniApp } from "@telegram-apps/sdk-react";


const TicketTmaSettings = () => {
  const tma = useMiniApp(true);

  useEffect(() => {
    tma?.setBgColor("#f0f0f0");
    tma?.setHeaderColor("#EFEFF4");
  }, [tma?.bgColor]);

  return <></>;
};

export default TicketTmaSettings;
