"use client";

import { Toaster } from "@/components/ui/toaster";
import { ConfigProvider } from "@/context/ConfigContext";
import { NavigationHistoryProvider } from "@/context/NavigationHistoryContext";
import { TonConnectUIProvider } from "@tonconnect/ui-react";
import { ThemeProvider } from "next-themes";
import React, { useEffect } from "react";
import WebAppProvider from "./_components/WebAppProvider";
import ThemeSetter from "./themeSetter";
import TRPCAPIProvider from "./_trpc/Provider";
import KonstaAppProvider from "./_components/KonstaAppProvider";
import UserSaver from "./_components/UserSaver";
import * as Sentry from "@sentry/nextjs";
import NotificationProvider from "./_components/NotificationProvider";

const Providers = ({ children, isDevStage }: { children: React.ReactNode; isDevStage: boolean }) => {
  useEffect(() => {
    isDevStage && import("eruda").then((lib) => lib.default.init());
    // isDevStage && alert("this is development");
  }, [isDevStage]);

  return (
    <Sentry.ErrorBoundary>
      <TonConnectUIProvider
        actionsConfiguration={{
          twaReturnUrl: `https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME}/event`,
        }}
        manifestUrl="https://gist.githubusercontent.com/nichitagutu/3cc22ee9749e77222c38313de47c94bc/raw/f37de28e672932101702f841d02d7414b93ca9ac/tonconnect-manifest.json"
      >
        <ThemeProvider
          defaultTheme="light"
          attribute="class"
        >
          <WebAppProvider>
            <TRPCAPIProvider>
              <NavigationHistoryProvider>
                <ConfigProvider>
                  <KonstaAppProvider>
                    <ThemeSetter>
                      <NotificationProvider>
                        <UserSaver>{children}</UserSaver>
                      </NotificationProvider>
                    </ThemeSetter>
                    <Toaster />
                  </KonstaAppProvider>
                </ConfigProvider>
              </NavigationHistoryProvider>
            </TRPCAPIProvider>
          </WebAppProvider>
        </ThemeProvider>
      </TonConnectUIProvider>
    </Sentry.ErrorBoundary>
  );
};

export default Providers;
