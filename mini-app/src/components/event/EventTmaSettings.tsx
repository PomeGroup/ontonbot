"use client";

import {
  useClosingBehavior,
  useMainButton,
  useMiniApp,
  useUtils,
} from "@telegram-apps/sdk-react";
import { useState, useEffect, useCallback } from "react";
import { useTonConnectUI } from "@tonconnect/ui-react";
import { useRouter, usePathname } from "next/navigation";
import { UserType } from "@/types/user.types";

type EventMainButtonProps = {
  eventManagerRole: boolean;
  eventId: string;
  orderAlreadyPlace: boolean;
  userHasTicket: boolean;
  isSoldOut: boolean;
  isFreeEvent: boolean;
  isInPersonEvent: boolean;
  userRole: UserType['userRole'];
  eventPrice: number;
  eventStartDate: Date | null;
  eventEndDate: Date | null;
};

const EventMainButton = ({ 
  eventManagerRole,
  eventId,
  orderAlreadyPlace,
  userHasTicket,
  isSoldOut,
  isFreeEvent,
  isInPersonEvent,
  userRole,
  eventPrice, //FIXME use this after connect wallet like "Pay 10 TON"
  eventStartDate,
  eventEndDate
}: EventMainButtonProps) => {
  const mainButton = useMainButton(true);
  const closeBehavior = useClosingBehavior(true);
  const tma = useMiniApp(true);
  const tmaUtils = useUtils(true);
  const router = useRouter();
  const pathname = usePathname();

  const [tonConnectUI] = useTonConnectUI();
  const [tonWalletAddress, setTonWalletAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleWalletConnection = useCallback((address: string) => {
    setTonWalletAddress(address);
    setIsLoading(false);
  }, []);

  const handleWalletDisconnection = useCallback(() => {
    setTonWalletAddress(null);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const checkWalletConnection = async () => {
      if (tonConnectUI.account?.address) {
        handleWalletConnection(tonConnectUI.account?.address);
      } else {
        handleWalletDisconnection();
      }
    };

    checkWalletConnection();

    const unsubscribe = tonConnectUI.onStatusChange((wallet) => {
      if (wallet) {
        handleWalletConnection(wallet.account.address);
      } else {
        handleWalletDisconnection();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [tonConnectUI, handleWalletConnection, handleWalletDisconnection]);

  const handleWalletAction = async () => {
    if (tonConnectUI.connected) {
      setIsLoading(true);
      await tonConnectUI.disconnect();
    } else {
      await tonConnectUI.openModal();
    }
  };

  function goToTicketPage() {
    router.push(`/event/${eventId}/my-ticket`);
  }

  function mainBtnOnClick() {
    router.push(`/event/${eventId}/buy-ticket`);
  }

  function editBtnOnClick() {
    router.push(`/event/${eventId}/edit`);
  }

  // Check if eventStartDate and eventEndDate are valid Date objects
  const eventStart = eventStartDate ? new Date(eventStartDate) : null;
  const eventEnd = eventEndDate ? new Date(eventEndDate) : null;
  const now = new Date();

  // Check event timing (ongoing, upcoming, past)
  const isOngoingEvent = eventStart && eventEnd ? eventStart <= now && eventEnd >= now : false;
  const isUpcomingEvent = eventStart ? eventStart > now : false;
  const isPastEvent = eventEnd ? eventEnd < now : false;

  const paidEvent = !isFreeEvent;

  useEffect(() => {
    // Admin or organizer should see "Edit Event"
    if (eventManagerRole) {
      mainButton?.setBgColor("#007AFF");
      mainButton?.setTextColor("#ffffff").setText(`Edit Event ${process.env.ENV === "development" ? " on EventTmaSetting" : ""}`);
      mainButton?.enable().show();
      mainButton?.hideLoader();
      mainButton?.on("click", editBtnOnClick);
      return () => {
        mainButton?.hide().disable();
        mainButton?.off("click", editBtnOnClick);
      };
    }

    // Conditions for regular users (userRole === "user")
    if (userRole === "user") {
      console.log("user");
      if (isFreeEvent) {
        console.log("free", isOngoingEvent, isUpcomingEvent, isPastEvent);
        // Free Ongoing event
        if (isInPersonEvent && isOngoingEvent) {
          console.log("Ongoing");
          mainButton?.setBgColor("#007AFF");
          mainButton?.setTextColor("#ffffff").setText("Connect Wallet to Check-in");
          mainButton?.enable().show();
          mainButton?.on("click", handleWalletAction);
        } else if (isUpcomingEvent) {
          // Free Upcoming event
          console.log("Upcoming");
          // if registerd
          if (userHasTicket) {
            mainButton?.setBgColor("#007AFF");
            mainButton?.setTextColor("#ffffff").setText("Get Ticket");
            mainButton?.enable().show();
            mainButton?.on("click", handleWalletAction);
          } // if not registerd
          else if (!userHasTicket) {
            mainButton?.setBgColor("#007AFF");
            mainButton?.setTextColor("#ffffff").setText("Get Ticket");
            mainButton?.enable().show();
            mainButton?.on("click", handleWalletAction);
          }
        }

      } else {
        // Free Past event
        console.log("Past");
        mainButton?.setBgColor("#007AFF");
        mainButton?.setTextColor("#ffffff").setText("Evet Ended");
        mainButton?.disable().show();
        mainButton?.on("click", handleWalletAction);
      }
    } else if (paidEvent) {
      // Paid Ongoing user Has Ticket event
      if (isOngoingEvent && userHasTicket) {
        mainButton?.setBgColor("#007AFF");
        mainButton?.setTextColor("#ffffff").setText("My Ticket for");
        mainButton?.enable().show();
        mainButton?.on("click", goToTicketPage);
        // Paid Ongoing user Has not Ticket event
      } else if (isOngoingEvent && !userHasTicket) {
        mainButton?.setBgColor("#007AFF");
        mainButton?.setTextColor("#ffffff").setText(`Buy Ticket for ${eventPrice}TON`);
        mainButton?.enable().show();
        mainButton?.on("click", goToTicketPage);
        // Paid Upcomming user Has Ticket event
      } else if (isUpcomingEvent && userHasTicket) {
        mainButton?.setBgColor("#007AFF");
        mainButton?.setTextColor("#ffffff").setText("My Ticket");
        mainButton?.enable().show();
        mainButton?.on("click", goToTicketPage);
        // Paid Upcomming Has not Ticket event
      } else if (isUpcomingEvent && !userHasTicket) {
        mainButton?.setBgColor("#007AFF");
        mainButton?.setTextColor("#ffffff").setText(`Buy Ticket for ${eventPrice}TON`);
        mainButton?.enable().show();
        mainButton?.on("click", goToTicketPage);
        // Paid Past user Has Ticket event
      } else if (isPastEvent && userHasTicket) {
        mainButton?.setBgColor("#007AFF");
        mainButton?.setTextColor("#ffffff").setText("My Ticket");
        mainButton?.enable().show();
        mainButton?.on("click", goToTicketPage);
        // Paid Past user Has not Ticket event
      } else if (isPastEvent && !userHasTicket) {
        mainButton?.setBgColor("#007AFF");
        mainButton?.setTextColor("#ffffff").setText(`Buy Ticket for ${eventPrice}TON`);
        mainButton?.enable().show();
        mainButton?.on("click", goToTicketPage);
      }
      mainButton?.setBgColor("#007AFF");
      mainButton?.setTextColor("#ffffff").setText(`Buy Ticket for ${eventPrice}TON`);
      mainButton?.enable().show();
      router.prefetch(`/event/${eventId}/buy-ticket`);
      mainButton?.on("click", mainBtnOnClick);
    }

    if (orderAlreadyPlace) {
      mainButton?.setBgColor("#007AFF");
      mainButton?.setTextColor("#ffffff").setText("Pending...");
      mainButton?.showLoader();
      mainButton?.disable().show();
      mainButton?.on("click", () => { });
      setTimeout(() => {
        // reload full application
        window.location.reload();
      }, 1000 * 60 * 5);
      return () => {
        mainButton?.hide().disable();
        mainButton?.off("click", mainBtnOnClick);
        mainButton?.off("click", goToTicketPage);
        mainButton?.hideLoader();
      };
    }

    // if (isFreeEvent) {
    //   mainButton?.hideLoader();
    //   return () => {
    //     mainButton?.hide().disable();
    //     mainButton?.off("click", mainBtnOnClick);
    //     mainButton?.off("click", goToTicketPage);
    //   };
    // }

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

    // if (isFreeEvent && isInPersonEvent && userRole === "user")  {

    // mainButton?.setBgColor("#007AFF");
    // mainButton?.setTextColor("#ffffff").setText("Buy Ticket test");
    // mainButton?.enable().show();

    // router.prefetch(`/event/${eventId}/buy-ticket`);
    // mainButton?.hideLoader();

    // mainButton?.on("click", mainBtnOnClick);
    // }


    return () => {
      mainButton?.hide().disable();
      mainButton?.off("click", mainBtnOnClick);
      mainButton?.off("click", goToTicketPage);
    };
  }, [
    mainButton,
    userRole,
    tonWalletAddress,
    isFreeEvent,
    isInPersonEvent,
    userHasTicket,
    orderAlreadyPlace,
    isOngoingEvent,
    isUpcomingEvent,
    isPastEvent
  ]);

  useEffect(() => {
    tma?.setBgColor("#ffffff");
    tma?.setHeaderColor("#ffffff");
  }, [tma?.bgColor]);

  return <></>;
};

export default EventMainButton;