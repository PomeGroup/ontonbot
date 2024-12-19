"use client";

import { PropsWithChildren, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@ui/base/sonner";
import QueryState from "@ui/components/blocks/QueryState";
import { Provider as JotaiProvider } from "jotai";

import { TmaSDKLoader } from "@repo/tma/TmaSDKLoader";

import AuthenticationProvider from "./AuthenticationProvider";
import FontLoader from "./FontLoader";
import TonProofProvider from "./TonProofProvider";

const queryClient = new QueryClient();

const Providers = ({ children }: PropsWithChildren) => {
  return (
    <JotaiProvider>
      <QueryClientProvider client={queryClient}>
        <TmaSDKLoader>
          <FontLoader>
            <Suspense fallback={<QueryState text="Authenticating" />}>
              <AuthenticationProvider>
                <TonProofProvider>
                  {children}
                  <Toaster
                    position={"bottom-center"}
                    closeButton={false}
                  />
                </TonProofProvider>
              </AuthenticationProvider>
            </Suspense>
          </FontLoader>
        </TmaSDKLoader>
      </QueryClientProvider>
    </JotaiProvider>
  );
};

export default Providers;
