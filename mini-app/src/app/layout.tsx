import { GoogleTagManager } from "@next/third-parties/google";
import type { Metadata, Viewport } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { cn } from "@/lib/utils";
import Script from "next/script";
import React from "react";
import { isDevStage } from "@/constants";
import NotificationHandler from "@/app/_components/NotificationHandler";

const mainFont = Roboto({
  subsets: ["latin"],
  weight: ["100", "300", "400", "500", "700", "900"],
});

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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {process.env.ENV !== "production" && (
          <meta
            name="robots"
            content="noindex"
          />
        )}
      </head>
      {process.env.ENV === "production" && <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM as string} />}
      <Script src="https://telegram.org/js/telegram-web-app.js"></Script>
      <body className={cn(mainFont.className)}>
        <Providers isDevStage={isDevStage}>
          <NotificationHandler />
          {children}
        </Providers>
        {process.env.NODE_ENV === "development" && (
          <script
            async
            src="http://localhost:8097"
          ></script>
        )}
      </body>
    </html>
  );
}
