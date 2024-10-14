"use client";

import { FC, useEffect, useRef } from "react";
import useWebApp from "@/hooks/useWebApp";
import { useMainButton } from "@telegram-apps/sdk-react";

export interface MainButtonProps {
  disabled?: boolean;
  color?: "primary" | "secondary";
  textColor?: `#${string}`;
  text?: string;
  onClick?: () => void;
  progress?: boolean;
}

const MainButton: FC<MainButtonProps> = ({
  disabled = false,
  color,
  textColor,
  text = "Next Step",
  onClick,
  progress = false, // Default to false
}) => {
  const WebApp = useWebApp();
  const mainButton = useMainButton(true);

  // Use a ref to store the click listener so we can clean it up properly
  const clickListenerRef = useRef<() => void>();

  useEffect(() => {
    mainButton?.setBgColor(
      color === "primary" ? "#2ea6ff" : color === "secondary" ? "#747480" : WebApp?.themeParams.button_color || "#007AFF"
    );
    mainButton?.setTextColor(textColor || WebApp?.themeParams.button_text_color || "#ffffff")
      .setText(text);
    mainButton?.enable().show();

    mainButton?.setParams({
      textColor: textColor || WebApp?.themeParams.button_text_color || "#ffffff", // Fallback to WebApp theme or white
    });

    // Set button text and disable/enable based on the progress state
    if (progress) {
      mainButton?.setText("Loading...").disable(); // Disable button during progress
    } else {
      mainButton?.setText(text).enable(); // Re-enable button if not in progress
    }

    // Define the click listener function
    const clickListener = () => {
      if (!progress && !disabled && onClick) {
        onClick();
      }
    };

    // Store the listener in the ref
    clickListenerRef.current = clickListener;

    // Attach the click listener
    mainButton?.on("click", clickListener);

    // Clean up the event listener on component unmount
    return () => {
      if (clickListenerRef.current) {
        mainButton?.off("click", clickListenerRef.current);
      }
    };
  }, [
    mainButton,
    WebApp,
    onClick,
    progress, // Trigger re-render when progress state changes
    disabled,
    text,
    color,
    textColor,
  ]);

  return null;
};

export default MainButton;
