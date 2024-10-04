import { useState, useEffect, useMemo, useCallback } from "react";
import { useMainButton } from "@telegram-apps/sdk-react";
import { useTonConnectUI, useTonWallet } from "@tonconnect/ui-react";
import useWebApp from "@/hooks/useWebApp";
import { Address } from "@ton/core";

export function useTonMainButton({
  defaultMessage = "Connect TON Wallet",
  customConnectedMessage, // This prop is optional, used for a custom message when connected
  onConnectedClick, // New prop for action after wallet connection
  retryLimit = 3,
}: {
  defaultMessage?: string;
  customConnectedMessage?: (address: string) => string;
  onConnectedClick?: () => void; // Optional function to call after wallet is connected
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
  const [retryCount, setRetryCount] = useState<number>(0);

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

  // Function to handle click after wallet is connected
  const handleConnectedClick = useCallback(() => {
    if (onConnectedClick) {
      onConnectedClick(); // Execute the custom action after connection
    }
  }, [onConnectedClick]);

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
      // Use custom message if provided, else fallback to default connected message
      const message = customConnectedMessage
        ? customConnectedMessage(friendlyAddress)
        : `Wallet Connected: ${friendlyAddress}`;

      mainButton.setText(message);
      mainButton.enable(); // Enable the button for the next action
      mainButton.on("click", handleConnectedClick); // On click after connection, run the custom action
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
      mainButton.off("click", handleConnectClick);
      mainButton.off("click", handleConnectedClick);
    };
  }, [
    mainButton,
    isWalletConnected,
    friendlyAddress,
    defaultMessage,
    customConnectedMessage,
    handleConnectClick,
    handleConnectedClick,
  ]);

  return { isWalletConnected, friendlyAddress };
}
