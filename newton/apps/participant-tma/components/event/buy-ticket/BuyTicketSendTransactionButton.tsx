import { useCallback, useEffect } from "react";
import { useMainButton } from "@tma.js/sdk-react";

const BuyTicketSendTransactionButton = (props: {
  price: string | number;
  validateForm: () => boolean;
  paymentType: "USDT" | "TON";
}) => {
  const mainButton = useMainButton(true);

  const buyTicketOnClick = useCallback(async () => {
    const isFormValid = props.validateForm();

    if (!isFormValid) {
      return;
    }
  }, [mainButton?.isEnabled]);

  useEffect(() => {
    mainButton?.setBgColor("#007AFF");
    mainButton?.setTextColor("#ffffff").setText(`Pay ${props.price} ${props.paymentType}`);
    mainButton?.enable().show();
    mainButton?.hideLoader();

    mainButton?.on("click", buyTicketOnClick);
    return () => {
      mainButton?.hide().disable();
      mainButton?.off("click", buyTicketOnClick);
    };
  }, [mainButton]);

  return <></>;
};

export default BuyTicketSendTransactionButton;
