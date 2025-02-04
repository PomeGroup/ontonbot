"use client";

import { Toaster } from "@/components/ui/toaster";
import { ConfigProvider } from "@/context/ConfigContext";
import { NavigationHistoryProvider } from "@/context/NavigationHistoryContext";
import { TonConnectUIProvider } from "@tonconnect/ui-react";
import { ThemeProvider } from "next-themes";
import React from "react";
import WebAppProvider from "./_components/WebAppProvider";
import ThemeSetter from "./themeSetter";
import TRPCAPIProvider from "./_trpc/Provider";
import KonstaAppProvider from "./_components/KonstaAppProvider";
import UserSaver from "./_components/UserSaver";
import * as Sentry from "@sentry/nextjs";
import NotificationProvider from "./_components/NotificationProvider";
const TELEMETREE_API_KEY = "ffdf302a-c23a-417d-932d-b82b46573742";
const TELEMETREE_PROJECT_ID = "57ca5abb-9d53-4417-b8eb-18cfb8345f0c"
const TELEMETREE_APP_NAME = "Onton-mini-app";

const Providers = ({ children }: { children: React.ReactNode }) => {
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
                  {/*<TwaAnalyticsProvider*/}
                  {/*  projectId={TELEMETREE_PROJECT_ID}*/}
                  {/*  apiKey={TELEMETREE_API_KEY}*/}
                  {/*  appName={TELEMETREE_APP_NAME}*/}
                  {/*>*/}
                    <KonstaAppProvider>
                      <ThemeSetter>
                        <NotificationProvider>
                          <UserSaver>{children}</UserSaver>
                        </NotificationProvider>
                      </ThemeSetter>
                      <Toaster />
                    </KonstaAppProvider>
                  {/*</TwaAnalyticsProvider>*/}
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
