import { useCallback, useEffect } from "react";
import { useMainButton } from "@telegram-apps/sdk-react";
import { useTonConnectUI } from "@tonconnect/ui-react";

const BuyTicketConnectWalletButton = () => {
  const [tonconnectUI] = useTonConnectUI();
  const mainButton = useMainButton(true);

  const connectWallet = useCallback(async () => {
    await tonconnectUI.openModal();
  }, [mainButton]);

  useEffect(() => {
    tonconnectUI.onModalStateChange((state) => {
      if (state.status === "closed") {
        mainButton?.show().enable();
      } else {
        mainButton?.hide().disable();
      }
    });
  }, [mainButton]);

  useEffect(() => {
    mainButton?.setBgColor("#007AFF");
    mainButton?.setTextColor("#ffffff").setText(`Connect Wallet`);
    mainButton?.enable().show();
    mainButton?.hideLoader();

    mainButton?.on("click", connectWallet);
    return () => {
      mainButton?.hide().disable();
      mainButton?.off("click", connectWallet);
    };
  }, [mainButton]);

  return <></>;
};

export default BuyTicketConnectWalletButton;
