"use client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";

export interface BackButtonProps {
  whereTo: string;
}

let isButtonShown = false;

const useWithBackButton = ({ whereTo }: BackButtonProps) => {
  const router = useRouter();
  const goBack = useCallback(() => {
    router.push(whereTo);
  }, [router, whereTo]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const WebApp = window.Telegram.WebApp;
    const backButton = WebApp.BackButton;
    backButton.show();
    isButtonShown = true;

    return () => {
      isButtonShown = false;
      setTimeout(() => {
        if (!isButtonShown) {
          backButton.hide();
        }
      }, 10);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const WebApp = window.Telegram.WebApp;
    WebApp.onEvent("backButtonClicked", goBack);

    return () => {
      WebApp.offEvent("backButtonClicked", goBack);
    };
  }, [goBack, whereTo]);
};

export { useWithBackButton };
