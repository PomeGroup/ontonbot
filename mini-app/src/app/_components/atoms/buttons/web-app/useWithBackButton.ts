"use client";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

// Props interface to accept a custom 'whereTo' path
export interface BackButtonProps {
  whereTo?: string; // Optional specific path to navigate to
}

// Custom Hook for Back Button Handling with optional 'whereTo'
export const useWithBackButton = ({ whereTo }: BackButtonProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const [history, setHistory] = useState<string[]>([]); // Store navigation history

  useEffect(() => {
    if (typeof window === "undefined" || !window.Telegram) return;
    const WebApp = window.Telegram.WebApp; // Access Telegram WebApp object
    const backButton = WebApp.BackButton;

    // Show the back button if not on the root page
    if (pathname !== "/") {
      backButton.show();
    } else {
      backButton.hide(); // Hide on root
    }

    // Track navigation history
    setHistory((prevHistory) => [...prevHistory, pathname]);

    // Handle back button click
    const handleBackButtonClick = () => {
      if (whereTo) {
        // Navigate to the specific path if 'whereTo' is provided
        router.push(whereTo);
      } else if (history.length > 1) {
        // Otherwise, go to the previous screen using router.back()
        router.back();
      } else {
        // If no previous screen, go to home
        router.push("/");
      }
    };

    // Register Telegram's backButton click event
    WebApp.onEvent("backButtonClicked", handleBackButtonClick);

    // Cleanup the event listener when the component is unmounted
    return () => {
      WebApp.offEvent("backButtonClicked", handleBackButtonClick);
    };
  }, [pathname, history, whereTo, router]);

  return null; // This component doesn't render anything
};
