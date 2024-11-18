import "@repo/ui/globals.css"

import { GoogleTagManager } from "@next/third-parties/google"
import { cn } from "@ui/lib/utils"
import type { Metadata } from "next"
import React from "react"

import Providers from "~/components/providers"
import { env } from "~/env.mjs"

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
      {process.env.NODE_ENV === "production" && (
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
