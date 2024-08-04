"use client";
import { FC, useEffect } from "react";

export interface MainButtonProps {
  disabled?: boolean;
  color?: string;
  textColor?: string;
  text?: string;
  onClick?: () => void;
  progress?: boolean;
}

const MainButton: FC<MainButtonProps> = ({
  disabled,
  color,
  textColor,
  text,
  onClick,
  progress,
}) => {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const WebApp = window.Telegram.WebApp;
    const { button_color, button_text_color } = WebApp.themeParams;

    return () => {
      WebApp.MainButton.hide();
      WebApp.MainButton.enable();
      WebApp.MainButton.hideProgress();
      WebApp.MainButton.setParams({
        color: button_color,
        text_color: button_text_color,
      });
    };
  }, []);

  // Handle progress and disabled state
  useEffect(() => {
    if (typeof window === "undefined") return;
    const WebApp = window.Telegram.WebApp;
    const { button_color, button_text_color } = WebApp.themeParams;

    if (typeof progress === "boolean") {
      if (progress) {
        WebApp.MainButton.showProgress();
      } else {
        WebApp.MainButton.hideProgress();
      }
    }
    if (typeof disabled === "boolean") {
      disabled || progress
        ? WebApp.MainButton.disable()
        : WebApp.MainButton.enable();
    }
  }, [disabled, progress]);

  // Update button color and text color
  useEffect(() => {
    if (typeof window === "undefined") return;
    const WebApp = window.Telegram.WebApp;
    const { button_color, button_text_color } = WebApp.themeParams;

    if (color || textColor) {
      WebApp.MainButton.setParams({ color, text_color: textColor });
    }
  }, [color, textColor]);

  // Update button text and visibility
  useEffect(() => {
    if (typeof window === "undefined") return;
    const WebApp = window.Telegram.WebApp;
    const { button_color, button_text_color } = WebApp.themeParams;

    if (text) {
      WebApp.MainButton.setText(text);
      if (!WebApp.MainButton.isVisible) {
        WebApp.MainButton.show();
      }
    } else if (WebApp.MainButton.isVisible) {
      WebApp.MainButton.hide();
    }
  }, [text]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const WebApp = window.Telegram.WebApp;
    const { button_color, button_text_color } = WebApp.themeParams;

    if (onClick) {
      WebApp.MainButton.onClick(onClick);
      return () => {
        WebApp.MainButton.offClick(onClick);
      };
    }
  }, [onClick]);

  return null;
};

export default MainButton;
