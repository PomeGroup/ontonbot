"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useBackButton, useMainButton, useMiniApp } from "@tma.js/sdk-react";
import { useTonConnectUI } from "@tonconnect/ui-react";
import { useAtomValue } from "jotai";

import { isRequestingTicketAtom } from "~/store/atoms/event.atoms";
import BuyTicketConnectWalletButton from "./BuyTicketConnectWalletButton";
import BuyTicketSendTransactionButton from "./BuyTicketSendTransactionButton";
import { PaymentType } from "~/types/order.types";

type BuyTicketTmaSettingsProps = {
  eventId: string;
  price: string | number;
  paymentType: PaymentType | null;
  isSoldOut: boolean;
  userHasTicket: boolean;
  orderAlreadyPlace: boolean;
  validateForm: () => boolean;
};

const BuyTicketTmaSettings = (props: BuyTicketTmaSettingsProps) => {
  const mainButton = useMainButton(true);
  const backButton = useBackButton(true);
  const tma = useMiniApp(true);
  const [tonconnectUI] = useTonConnectUI();
  const isRequestingTicket = useAtomValue(isRequestingTicketAtom);

  // state
  const router = useRouter();

  // main button
  useEffect(() => {
    if (props.userHasTicket) {
      if (!isRequestingTicket.state) {
        router.push(`/ticket/${props.eventId}`);
      }
      mainButton?.hideLoader();

      mainButton?.hide().disable();
      return () => {
        mainButton?.hide().disable();
      };
    }

    if (props.orderAlreadyPlace) {
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
        mainButton?.hideLoader();
      };
    }

    if (props.isSoldOut) {
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
      router.push(`/event/${props.eventId}`);
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
      {props.userHasTicket || isRequestingTicket.state || props.isSoldOut ? (
        <></>
      ) : tonconnectUI.account?.address ? (
        props.paymentType && (
          <BuyTicketSendTransactionButton
            validateForm={props.validateForm}
            price={props.price}
            paymentType={props.paymentType}
          />
        )
      ) : (
        <BuyTicketConnectWalletButton />
      )}
    </>
  );
};

export default BuyTicketTmaSettings;
