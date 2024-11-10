"use client";

import { Toaster } from "@/components/ui/toaster";
import { ConfigProvider } from "@/context/ConfigContext";
import { NavigationHistoryProvider } from "@/context/NavigationHistoryContext";
import { TonConnectUIProvider } from "@tonconnect/ui-react";
import { ThemeProvider } from "next-themes";
import Script from "next/script";
import React from "react";
import WebAppProvider from "./_components/WebAppProvider";
import ThemeSetter from "./themeSetter";

const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <TonConnectUIProvider
      actionsConfiguration={{
        twaReturnUrl: `https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME}/event`,
      }}
      manifestUrl="https://gist.githubusercontent.com/nichitagutu/3cc22ee9749e77222c38313de47c94bc/raw/f37de28e672932101702f841d02d7414b93ca9ac/tonconnect-manifest.json"
    >
      <Script
        src="https://unpkg.com/@lottiefiles/lottie-player@latest/dist/tgs-player.js"
        async
      />
      <ThemeProvider
        attribute="class"
      >
        <WebAppProvider>
          <NavigationHistoryProvider>
            <ConfigProvider>
              <ThemeSetter>{children}</ThemeSetter>
              <Toaster />
            </ConfigProvider>
          </NavigationHistoryProvider>
        </WebAppProvider>
      </ThemeProvider>
    </TonConnectUIProvider>
  );
};

export default Providers;
