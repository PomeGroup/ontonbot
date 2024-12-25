"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useBackButton, useMainButton, useMiniApp } from "@tma.js/sdk-react";
import { useTonConnectUI } from "@tonconnect/ui-react";
import { useAtomValue } from "jotai";

import { isRequestingTicketAtom } from "~/store/atoms/event.atoms";
import BuyTicketConnectWalletButton from "./BuyTicketConnectWalletButton";
import BuyTicketSendTransactionButton from "./BuyTicketSendTransactionButton";

type BuyTicketTmaSettingsProps = {
  eventId: string;
  price: string | number;
  isSoldOut: boolean;
  userHasTicket: boolean;
  orderAlreadyPlace: boolean;
  validateForm: () => boolean;
};

const BuyTicketTmaSettings = ({
  eventId,
  price,
  isSoldOut,
  userHasTicket,
  orderAlreadyPlace,
  validateForm,
}: BuyTicketTmaSettingsProps) => {
  const mainButton = useMainButton(true);
  const backButton = useBackButton(true);
  const tma = useMiniApp(true);
  const [tonconnectUI] = useTonConnectUI();
  const isRequestingTicket = useAtomValue(isRequestingTicketAtom);

  // state
  const router = useRouter();

  // main button
  useEffect(() => {
    if (userHasTicket) {
      if (!isRequestingTicket.state) {
        router.push(`/ticket/${eventId}`);
      }
      mainButton?.hideLoader();

      mainButton?.hide().disable();
      return () => {
        mainButton?.hide().disable();
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
        1000 * 60 * 5,
      );
      return () => {
        mainButton?.hide().disable();
        mainButton?.hideLoader();
      };
    }

    if (isSoldOut) {
      mainButton?.setBgColor("#E9E8E8");
      mainButton?.setTextColor("#BABABA").setText(`SOLD OUT`);
      mainButton?.disable().show();
      mainButton?.hideLoader();

      return () => {
        mainButton?.hide().disable();
      };
    }

    return () => {
      mainButton?.hideLoader();
      mainButton?.hide().disable();
    };
  }, [mainButton]);

  // back button
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
    tma?.setBgColor("#EFEFF4");
    tma?.setHeaderColor("#EFEFF4");
  }, [tma?.bgColor]);

  return (
    <>
      {userHasTicket || isRequestingTicket.state || isSoldOut ? (
        <></>
      ) : tonconnectUI.account?.address ? (
        <BuyTicketSendTransactionButton
          validateForm={validateForm}
          price={price}
        />
      ) : (
        <BuyTicketConnectWalletButton />
      )}
    </>
  );
};

export default BuyTicketTmaSettings;
