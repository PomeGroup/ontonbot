"use client";

import { PropsWithChildren, Suspense, useRef, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@ui/base/sonner";
import QueryState from "@ui/components/blocks/QueryState";
import { Provider as JotaiProvider } from "jotai";

import { TmaSDKLoader } from "@repo/tma/TmaSDKLoader";

import AuthenticationProvider from "./AuthenticationProvider";
import FontLoader from "./FontLoader";
import TonProofProvider from "./TonProofProvider";
import { useTransferTon } from "~/hooks/ton.hooks";
import { TonConnectButton, TonConnectUIProvider, useTonWallet } from "@tonconnect/ui-react";
import { Button } from "@ui/base/button";
import { Address } from "@ton/ton";

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
                  <TonConnectUIProvider manifestUrl="https://storage.onton.live/onton/manifest.json">
                    <TestPayment />
                  </TonConnectUIProvider>
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

const TestPayment = () => {
  const transfer = useTransferTon();
  const wallet = useTonWallet();
  const [address, setAddress] = useState("");
  return (
    <div>
      {wallet?.account.address}
      <TonConnectButton />
      <input
        placeholder="destination"
        onChange={(e) => setAddress(e.target.value)}
      />
      <Button
        onClick={() => {
          const destination = Address.parse(address);
          transfer(destination.toString(), 12, "USDT", {
            comment: "pashmak",
          }).then(() => {
            alert("Done");
          });
        }}
      >
        send some usdt
      </Button>
    </div>
  );
};

export default Providers;
