"use client";

import React from "react";
import { ThemeProvider } from "next-themes";
import { TonConnectUIProvider } from "@tonconnect/ui-react";
import ThemeSetter from "./themeSetter";

const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      <TonConnectUIProvider actionsConfiguration={{
        twaReturnUrl: "https://t.me/on_ton_bot/event",
      }}

        manifestUrl="https://gist.githubusercontent.com/nichitagutu/3cc22ee9749e77222c38313de47c94bc/raw/f37de28e672932101702f841d02d7414b93ca9ac/tonconnect-manifest.json" >
        <ThemeProvider attribute="class">
          <ThemeSetter>{children}</ThemeSetter>
        </ThemeProvider>
      </TonConnectUIProvider>
    </div>
  );
};

export default Providers;
