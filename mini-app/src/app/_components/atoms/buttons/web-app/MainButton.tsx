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
}

const MainButton: FC<MainButtonProps> = ({
  disabled = false,
  color,
  textColor,
  text,
  onClick,
  progress = false,
}) => {
  const WebApp = useWebApp();

  const buttonParams = useMemo(
    () => ({
      color:
        color === "primary"
          ? "#2ea6ff"
          : color === "secondary"
            ? "#747480"
            : undefined,
      text_color: textColor,
    }),
    [color, textColor]
  );

  const updateButton = useCallback(() => {
    if (!WebApp) return;

    const { button_color, button_text_color } = WebApp.themeParams;

    if (text) {
      WebApp.MainButton.setText(text);
      WebApp.MainButton.show();
    } else {
      WebApp.MainButton.hide();
    }

    WebApp.MainButton.setParams({
      color: buttonParams.color || button_color,
      text_color: buttonParams.text_color || button_text_color,
    });

    if (progress) {
      WebApp.MainButton.showProgress();
    } else {
      WebApp.MainButton.hideProgress();
    }

    if (disabled || progress) {
      WebApp.MainButton.disable();
    } else {
      WebApp.MainButton.enable();
    }
  }, [WebApp, text, buttonParams, disabled, progress, color]);

  useEffect(() => {
    if (!WebApp) return;

    updateButton();

    if (onClick) {
      WebApp.MainButton.onClick(onClick);
    }

    return () => {
      WebApp.MainButton.hide();
      WebApp.MainButton.enable();
      WebApp.MainButton.hideProgress();
      WebApp.MainButton.setParams({
        color: WebApp.themeParams.button_color,
        text_color: WebApp.themeParams.button_text_color,
      });
      if (onClick) {
        WebApp.MainButton.offClick(onClick);
      }
    };
  }, [
    WebApp,
    updateButton,
    onClick,
    progress,
    disabled,
    buttonParams,
    text,
    color,
    textColor,
  ]);

  return null;
};

export default MainButton;

// export interface MainButtonProps {
//   disabled?: boolean;
//   text?: string;
//   color?: "primary" | "secondary";
//   onClick?: () => void;
//   progress?: boolean;
// }

// const MainButton: FC<MainButtonProps> = ({
//   disabled = false,
//   text,
//   color,
//   onClick,
//   progress = false,
// }) => (
//   <>
//     {createPortal(
//       <h1 className="sticky bottom-0 py-2 px-4 bg-background border-t border-muted w-full">
//         <Button
//           variant={color || "primary"}
//           className="w-full"
//           onClick={onClick}
//           disabled={progress || disabled}
//         >
//           {progress ? <LucideLoader2 className="animate-spin" /> : text}
//         </Button>
//       </h1>,
//       window.document.body
//     )}
//   </>
// );

// export default MainButton;
