import { useEffect } from "react";
import useWebApp from "./useWebApp";

interface MainButtonOptions {
  disabled?: boolean;
  isLoading?: boolean;
  color?: `#${string}`;
}

/**
 * @param onClick - fires on click event
 * @param text - main button text
 * @param options - main button options
 */
export function useMainButton(onClick: () => void, text: string, options?: MainButtonOptions) {
  const webApp = useWebApp();

  useEffect(() => {
    webApp?.MainButton.onClick(onClick);
    webApp?.MainButton.setText(text);
    webApp?.MainButton.show();

    webApp?.MainButton.setParams({ color: options?.color });

    if (options?.isLoading) {
      webApp?.MainButton.showProgress();
    } else {
      webApp?.MainButton.hideProgress();
    }

    if (options?.disabled) {
      webApp?.MainButton.disable();
    } else {
      webApp?.MainButton.enable();
    }

    return () => {
      webApp?.MainButton.offClick(onClick);
      webApp?.MainButton.setText(text);
      webApp?.MainButton.hide();
    };
  }, [webApp?.MainButton, options?.disabled, options?.isLoading, options?.color, onClick, text]);
}
