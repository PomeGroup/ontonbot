"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  useClosingBehavior,
  useMainButton,
  useMiniApp,
  useUtils,
} from "@telegram-apps/sdk-react";

type EventMainButtonProps = {
  eventId: string;
  requiresTicketToCheckin: boolean;
  orderAlreadyPlace: boolean;
  userHasTicket: boolean;
  isSoldOut: boolean;
  eventManagerRole: boolean;
};

const EventTmaSettings = ({
  eventId,
  requiresTicketToCheckin: requiresTicketToCheckin,
  isSoldOut,
  orderAlreadyPlace,
  userHasTicket,
  eventManagerRole,
}: EventMainButtonProps) => {
  const mainButton = useMainButton(true);
  const closeBehavior = useClosingBehavior(true);
  const tma = useMiniApp(true);
  const tmaUtils = useUtils(true);
  const router = useRouter();

  function goToTicketPage() {
    router.push(`/ticket/${eventId}`);
  }

  function mainBtnOnClick() {
    router.push(`/event/${eventId}/buy-ticket`);
  }

  function manageEventBtnOnClick() {
    router.push(`/event/${eventId}/event-management`);
  }

  // if user is admin or organizer show Edit event. else show noting!
  useEffect(() => {
    // if the user had manager access we will show the Edit event button
    if (eventManagerRole) {
      mainButton?.setBgColor("#007AFF");
      mainButton?.setTextColor("#ffffff").setText(`Edit Event ${process.env.ENV === "development" && " on EventTmaSetting"}`);
      mainButton?.enable().show();
      mainButton?.hideLoader();
      mainButton?.on("click", manageEventBtnOnClick);
      return () => {
        mainButton?.hide().disable();
        mainButton?.off("click", manageEventBtnOnClick);
      };
    }

    if (userHasTicket) {
      mainButton?.setBgColor("#e1efff");
      mainButton?.setTextColor("#007aff").setText("My Ticket");
      mainButton?.enable().show();
      mainButton?.hideLoader();
      mainButton?.on("click", goToTicketPage);
      return () => {
        mainButton?.hide().disable();
        mainButton?.off("click", mainBtnOnClick);
        mainButton?.off("click", goToTicketPage);
      };
    }

    if (orderAlreadyPlace) {
      mainButton?.setBgColor("#007AFF");
      mainButton?.setTextColor("#ffffff").setText("Pending...");
      mainButton?.showLoader();
      mainButton?.disable().show();
      mainButton?.on("click", () => {});
      setTimeout(
        () => {
          // reload full application
          window.location.reload();
        },
        1000 * 60 * 5
      );
      return () => {
        mainButton?.hide().disable();
        mainButton?.off("click", mainBtnOnClick);
        mainButton?.off("click", goToTicketPage);
        mainButton?.hideLoader();
      };
    }

    if (!requiresTicketToCheckin) {
      mainButton?.hideLoader();

      return () => {
        mainButton?.hide().disable();
        mainButton?.off("click", mainBtnOnClick);
        mainButton?.off("click", goToTicketPage);
      };
    }

    if (isSoldOut) {
      mainButton?.setBgColor("#E9E8E8");
      mainButton?.setTextColor("#BABABA").setText(`SOLD OUT`);
      mainButton?.hideLoader();

      mainButton?.disable().show();
      return () => {
        mainButton?.hide().disable();
        mainButton?.off("click", mainBtnOnClick);
        mainButton?.off("click", goToTicketPage);
      };
    }

    mainButton?.setBgColor("#007AFF");
    mainButton?.setTextColor("#ffffff").setText("Buy Ticket");
    mainButton?.enable().show();

    router.prefetch(`/event/${eventId}/buy-ticket`);
    mainButton?.hideLoader();

    mainButton?.on("click", mainBtnOnClick);

    return () => {
      mainButton?.hide().disable();
      mainButton?.off("click", mainBtnOnClick);
      mainButton?.off("click", goToTicketPage);
    };
  }, [mainButton?.isVisible]);


  useEffect(() => {
    tma?.setBgColor("#ffffff");
    tma?.setHeaderColor("#ffffff");
  }, [tma?.bgColor]);

  return <></>;
};

export default EventTmaSettings;
