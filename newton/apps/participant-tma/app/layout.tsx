import "@repo/ui/globals.css";

import React from "react";
import type { Metadata } from "next";
import { GoogleTagManager } from "@next/third-parties/google";
import { cn } from "@ui/lib/utils";

import Providers from "~/components/providers";
import { env } from "~/env.mjs";

export const metadata: Metadata = {
  title: "Onton",
  description: "Events on TON Ecosystem",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <html lang="en" className={cn("theme-light platform-ios")}>
      <head>
        {process.env.ENV !== "production" && (
          <meta name="robots" content="noindex" />
        )}
      </head>
      {process.env.ENV === "production" && (
        <GoogleTagManager gtmId={env.NEXT_PUBLIC_GTM as string} />
      )}
      <body>
        <Providers>
          {/*<DocumentPlatformProvider />*/}
          {children}
        </Providers>
      </body>
    </html>
  );
}
