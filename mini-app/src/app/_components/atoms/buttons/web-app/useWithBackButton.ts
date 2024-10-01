"use client";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { useBackButtonRaw } from "@telegram-apps/sdk-react";

export interface BackButtonProps {
  whereTo?: string; // Optional specific path to navigate to
}

export const useWithBackButton = ({ whereTo }: BackButtonProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const [history, setHistory] = useState<string[]>([]); // Track navigation history
  const { cleanup, error, result } = useBackButtonRaw(); // Hook from Telegram SDK

  // Memoize the back button click handler
  const handleBackButtonClick = useCallback(() => {
    if (whereTo) {
      router.push(whereTo); // Navigate to the specific path if provided
    } else if (history.length > 1) {
      router.back(); // Go back to the previous screen
    } else {
      router.push("/"); // Default to home if no history
    }
  }, [whereTo, history, router]);

  useEffect(() => {
    if (error) {
      console.error("Back button error:", error); // Handle errors
      return;
    }

    if (!result) return; // Exit if result is not ready

    // Show or hide the back button based on the current path
    if (pathname !== "/") {
      result.show?.();
    } else {
      result.hide?.();
    }

    // Only push the current pathname to history if it's new
    setHistory((prevHistory) => {
      if (prevHistory[prevHistory.length - 1] !== pathname) {
        return [...prevHistory, pathname];
      }
      return prevHistory;
    });

    // Register the back button click handler
    result.on?.("click", handleBackButtonClick);

    // Cleanup the event listener on unmount
    return () => {
      cleanup?.();
    };
  }, [pathname, result, error, handleBackButtonClick, cleanup]);

  return null; // This hook doesn't render anything
};
