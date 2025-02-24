"use client";

import useWebApp from "@/hooks/useWebApp";
import { useTheme } from "next-themes";
import { useEffect } from "react";

export default function ThemeSetter({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  const webApp = useWebApp();
  const habticfeedback = webApp?.HapticFeedback;

  useEffect(() => {
    webApp?.expand();

    webApp?.setHeaderColor(theme === "dark" ? "#1C1C1E" : "#ffffff");
    webApp?.setBackgroundColor(theme === "dark" ? "#1C1C1E" : "#ffffff");
    habticfeedback?.impactOccurred("light");
    if (theme === "dark") {
      document.body.style.backgroundColor = "#1C1C1E";
    } else {
      document.body.style.backgroundColor = "#ffffff";
    }
    try {
      webApp?.ready();
    } catch {}
  }, [habticfeedback, theme, webApp]);

  useEffect(() => {
    console.log("current theme", {
      theme,
    });
  }, [theme]);

  return children;
}
