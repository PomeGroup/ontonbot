import { useState, useEffect, useMemo, useCallback } from "react";
import { useMainButton } from "@telegram-apps/sdk-react";
import { useTonConnectUI, useTonWallet } from "@tonconnect/ui-react";
import useWebApp from "@/hooks/useWebApp";
import { Address } from "@ton/core";

export function useTonMainButton({
  defaultMessage = "Connect TON Wallet",
  customConnectedMessage,
  retryLimit = 3, // Add a retry limit to avoid infinite loops
}: {
  defaultMessage?: string;
  customConnectedMessage?: (address: string) => string;
  retryLimit?: number;
}) {
  const mainButton = useMainButton(true); // Initialize the main button
  const webApp = useWebApp();
  const wallet = useTonWallet();
  const [tonConnectUI] = useTonConnectUI();
  const hapticFeedback = webApp?.HapticFeedback;

  const [isWalletConnected, setIsWalletConnected] = useState<
    boolean | undefined
  >(undefined);
  const [retryCount, setRetryCount] = useState<number>(0); // Track the retry attempts

  // User's wallet-friendly address
  const friendlyAddress = useMemo(() => {
    if (wallet?.account?.address) {
      return Address.parse(wallet.account.address).toString({
        bounceable: false,
      });
    }
  }, [wallet]);

  // Function to handle wallet connection click
  const handleConnectClick = useCallback(async () => {
    if (!tonConnectUI.account) {
      await tonConnectUI.openModal();
      hapticFeedback?.impactOccurred("medium");
    }
  }, [tonConnectUI, hapticFeedback]);

  // Retry connection if wallet address is undefined
  useEffect(() => {
    if (!isWalletConnected && retryCount < retryLimit) {
      console.log(`Retrying connection... Attempt ${retryCount + 1}`);
      handleConnectClick(); // Retry connection
      setRetryCount(retryCount + 1);
    }
  }, [isWalletConnected, retryCount, retryLimit, handleConnectClick]);

  // Effect to check wallet connection state
  useEffect(() => {
    setIsWalletConnected(
      wallet !== null && wallet?.account?.address !== undefined
    );
  }, [wallet]);

  // Effect to control the main button state
  useEffect(() => {
    if (!mainButton) return;

    if (isWalletConnected && friendlyAddress) {
      // Show custom message if connected
      const message = customConnectedMessage
        ? customConnectedMessage(friendlyAddress)
        : `Wallet Connected: ${friendlyAddress}`;

      mainButton.setText(message);
      mainButton.disable();
      mainButton.hideLoader();
    } else {
      // Show default connect message if not connected
      mainButton.setText(defaultMessage);
      mainButton.enable();
      mainButton.on("click", handleConnectClick);
      mainButton.hideLoader();
    }

    // Cleanup function to remove the event listener
    return () => {
      mainButton.off("click", handleConnectClick); // Properly remove the click listener
    };
  }, [
    mainButton,
    isWalletConnected,
    friendlyAddress,
    defaultMessage,
    customConnectedMessage,
    handleConnectClick,
  ]);

  return { isWalletConnected, friendlyAddress };
}
