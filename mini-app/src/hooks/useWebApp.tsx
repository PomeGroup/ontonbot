import { isEmptyObject } from "@/utils";
import { useEffect, useState } from "react";

const useWebApp = () => {
  const [webApp, setWebApp] = useState<WebApp>({} as WebApp);

  useEffect(() => {
    const checkWebApp = () => {
      if (typeof window !== "undefined" && window.Telegram && window.Telegram.WebApp) {
        setWebApp(window.Telegram.WebApp);
      }
    };

    checkWebApp();

    const intervalId = setInterval(checkWebApp, 300);

    return () => clearInterval(intervalId);
  }, []);

  if (isEmptyObject(webApp)) {
    return null;
  }

  return webApp;
};

export default useWebApp;
