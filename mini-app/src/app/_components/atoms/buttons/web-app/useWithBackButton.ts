"use client";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useBackButtonRaw } from "@telegram-apps/sdk-react"; // Import the correct hook

// Props interface to accept a custom 'whereTo' path
export interface BackButtonProps {
  whereTo?: string; // Optional specific path to navigate to
}

// Custom Hook for Back Button Handling with optional 'whereTo'
export const useWithBackButton = ({ whereTo }: BackButtonProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const [history, setHistory] = useState<string[]>([]); // Store navigation history
  const { cleanup, error, result } = useBackButtonRaw(); // Using useBackButtonRaw

  useEffect(() => {
    if (error) {
      console.error("Back button error:", error); // Log or handle errors
      return;
    }

    // Check if back button result exists and works
    if (!result) {
      return;
    }

    // Show the back button if not on the root page, otherwise hide it
    if (pathname !== "/") {
      result.show?.();
    } else {
      result.hide?.();
    }

    // Track navigation history
    setHistory((prevHistory) => [...prevHistory, pathname]);

    // Define the back button click handler
    const handleBackButtonClick = () => {
      if (whereTo) {
        // Navigate to the specific path if 'whereTo' is provided
        router.push(whereTo);
      } else if (history.length > 1) {
        // Go back to the previous screen
        router.back();
      } else {
        // Default to home if no history
        router.push("/");
      }
    };

    // Register the back button event listener
    result.on?.("click", handleBackButtonClick);

    // Cleanup the event listener when the component unmounts
    return () => {
      cleanup?.(); // Ensure cleanup is defined before calling
    };
  }, [pathname, history.length, whereTo, router, result, error, cleanup]);

  return null; // This hook doesn't render anything
};
