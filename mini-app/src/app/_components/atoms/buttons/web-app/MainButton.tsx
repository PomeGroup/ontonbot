"use client";
import useWebApp from "@/hooks/useWebApp";
import { FC, useCallback, useEffect, useMemo } from "react";

export interface MainButtonProps {
  disabled?: boolean;
  color?: "primary" | "secondary";
  textColor?: string;
  text?: string;
  onClick?: () => void;
  progress?: boolean;
  buttonType?: "MainButton" | "SecondaryButton";
}

const MainButton: FC<MainButtonProps> = ({
  disabled = false,
  color,
  textColor,
  text,
  onClick,
  progress = false,
  buttonType = "MainButton",
}) => {
  const WebApp = useWebApp();

  const buttonParams = useMemo(
    () => ({
      color: color === "primary" ? "#2ea6ff" : color === "secondary" ? "#747480" : undefined,
      text_color: textColor,
    }),
    [color, textColor]
  );

  const updateButton = useCallback(() => {
    if (!WebApp) return;

    const { button_color, button_text_color } = WebApp.themeParams;

    if (text) {
      WebApp[buttonType].setText(text);
      WebApp[buttonType].show();
    } else {
      WebApp[buttonType].hide();
    }

    WebApp[buttonType].setParams({
      color: buttonParams.color || button_color,
      text_color: buttonParams.text_color || button_text_color,
    });

    if (progress) {
      WebApp[buttonType].showProgress();
    } else {
      WebApp[buttonType].hideProgress();
    }

    if (disabled || progress) {
      WebApp[buttonType].disable();
    } else {
      WebApp[buttonType].enable();
    }
  }, [WebApp, text, buttonParams, disabled, progress]);

  useEffect(() => {
    if (!WebApp) return;

    updateButton();

    if (onClick) {
      WebApp[buttonType].onClick(onClick);
    }

    return () => {
      WebApp[buttonType].hide();
      WebApp[buttonType].enable();
      WebApp[buttonType].hideProgress();
      WebApp[buttonType].setParams({
        color: WebApp.themeParams.button_color,
        text_color: WebApp.themeParams.button_text_color,
      });
      if (onClick) {
        WebApp[buttonType].offClick(onClick);
      }
    };
  }, [WebApp, updateButton, onClick, progress, disabled, buttonParams, text, color, textColor]);

  return null;
};

export default MainButton;
