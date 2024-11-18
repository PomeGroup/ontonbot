import { useCallback, useEffect } from "react";
import { useMainButton } from "@tma.js/sdk-react";

const BuyTicketSendTransactionButton = ({
  price,
  validateForm,
}: {
  price: string | number;
  validateForm: () => boolean;
}) => {
  const mainButton = useMainButton(true);

  const buyTicketOnClick = useCallback(async () => {
    const isFormValid = validateForm();

    if (!isFormValid) {
      return;
    }
  }, [mainButton?.isEnabled]);

  useEffect(() => {
    mainButton?.setBgColor("#007AFF");
    mainButton?.setTextColor("#ffffff").setText(`Pay ${price} TON`);
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
