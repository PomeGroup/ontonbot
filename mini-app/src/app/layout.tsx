import { GoogleTagManager } from "@next/third-parties/google";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Providers from "./providers";
import * as Sentry from "@sentry/nextjs";
import { cn } from "@/lib/utils";
import Script from "next/script";
import React from "react";
import UserSaver from "./_components/UserSaver";
import Provider from "./_trpc/Provider";

import { Root } from "@/components/Root/Root";

import "@telegram-apps/telegram-ui/dist/styles.css";
import "normalize.css/normalize.css";
import "./_assets/globals.css";
import DeveloperGuid from "./_components/developerGuid";
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Onton",
  description: "Events on TON",
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1.0,
  maximumScale: 1.0,
  userScalable: false,
};
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className="overflow-x-hidden w-full"
    >
      {process.env.ENV === "production" && (
        <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM as string} />
      )}
      <Script src="https://telegram.org/js/telegram-web-app.js"></Script>
      <body className={cn(inter.className)}>
        <Sentry.ErrorBoundary>
          <Provider>
            <Providers>
              <UserSaver>
                <Root>
                  {process.env.ENV === "development" && <DeveloperGuid/>}                  
                    {process.env.ENV === "staging" && (
                      <div className="flex justify-center py-2 text-xs">
                        ⚠️ you are On Staging App ⚠️
                      </div>
                    )}

                    {children}
                </Root>
              </UserSaver>
            </Providers>
          </Provider>
        </Sentry.ErrorBoundary>
      </body>
    </html>
  );
}
