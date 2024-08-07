"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";
import useWebApp from "@/hooks/useWebApp";

export default function ThemeSetter({
  children,
}: {
  children: React.ReactNode;
}) {
  const { theme, setTheme } = useTheme();
  const webApp = useWebApp();
  const themeParams = webApp?.themeParams;
  const habticfeedback = webApp?.HapticFeedback;

  useEffect(() => {
    webApp?.expand();

    if (!themeParams) {
      return;
    }

    setTheme("dark");
    webApp?.setHeaderColor(theme === "dark" ? "#1C1C1E" : "#ffffff");
    webApp?.setBackgroundColor(theme === "dark" ? "#1C1C1E" : "#ffffff");
    habticfeedback?.impactOccurred("light");
  }, [theme, setTheme, themeParams, webApp]);

  return <div>{children}</div>;
}
