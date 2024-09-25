"use client";

import { PropsWithChildren, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TonConnectUIProvider } from "@tonconnect/ui-react";
import QueryState from "@/components/blocks/QueryState";
import { Provider as JotaiProvider } from "jotai";
import AuthenticationProvider from "./AuthenticationProvider";
import FontLoader from "./FontLoader";
import { Toaster } from "sonner";
import { TmaSDKLoader } from "../tma";

const queryClient = new QueryClient();

const Providers = ({ children }: PropsWithChildren) => {
  return (
    <JotaiProvider>
      <TonConnectUIProvider
        manifestUrl="https://storage.onton.live/onton/manifest.json"
        actionsConfiguration={{
          twaReturnUrl: `https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME}/event`,
        }}
      >
        <QueryClientProvider client={queryClient}>
          <TmaSDKLoader>
            <FontLoader>
              <Suspense fallback={<QueryState text="Authenticating" />}>
                <AuthenticationProvider>
                  {children}
                  <Toaster
                    position={"bottom-center"}
                    closeButton={false}
                  />
                </AuthenticationProvider>
              </Suspense>
            </FontLoader>
          </TmaSDKLoader>
        </QueryClientProvider>
      </TonConnectUIProvider>
    </JotaiProvider>
  );
};

export default Providers;
