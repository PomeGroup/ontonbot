import { GoogleTagManager } from "@next/third-parties/google";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import * as Sentry from "@sentry/nextjs";
import { cn } from "@/lib/utils";
import Script from "next/script";
import React from "react";
import UserSaver from "./_components/UserSaver";

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
      {process.env.NODE_ENV === "production" && (
        <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM as string} />
      )}
      <Script src="https://telegram.org/js/telegram-web-app.js"></Script>
      <body className={cn(inter.className)}>
        <Sentry.ErrorBoundary>
          <Providers>
            <UserSaver>
              <main className="px-4 py-1">
                {process.env.ENV === "staging" && (
                  <div className="flex justify-center bg-yellow-100 text-gray-600 py-2 text-xs">
                    ⚠️ you are On Staging App ⚠️
                  </div>
                )}

                {children}
              </main>
            </UserSaver>
          </Providers>
        </Sentry.ErrorBoundary>
      </body>
    </html>
  );
}
