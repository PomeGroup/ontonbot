import { useEffect } from "react";
import { useLaunchParams } from "@tma/hooks";
import { TonConnectUIProvider, useTonConnectUI } from "@tonconnect/ui-react";

import { env } from "~/env.mjs";

export function TonProvider(props: {
  children: React.ReactNode;
  startAppParam?: string;
}) {
  return (
    <TonConnectUIProvider
      manifestUrl="https://storage.onton.live/onton/manifest.json"
      actionsConfiguration={{
        twaReturnUrl: props.startAppParam
          ? `https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME}/event?startapp=${props.startAppParam}`
          : `https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME}/event`,
      }}
    >
      <SyncWallet />
      {props.children}
    </TonConnectUIProvider>
  );
}

const SyncWallet = () => {
  const [tonconnect] = useTonConnectUI();
  const lunchParams = useLaunchParams();

  useEffect(() => {
    tonconnect.onStatusChange((connectedWallet) => {
      // user.addWallet
      if (connectedWallet?.account.address && lunchParams?.initDataRaw) {
        fetch(
          `${env.NEXT_PUBLIC_API_BASE_URL.replace("/v1", "")}/trpc/users.addWallet`,
          {
            headers: {
              "content-type": "application/json",
            },
            body: JSON.stringify({
              init_data: lunchParams?.initDataRaw,
              wallet: connectedWallet?.account.address,
            }),
            method: "POST",
          },
        ).catch((error) => {
          console.error("adding wallet failed", error);
        });
      }
    });
  }, [lunchParams?.initDataRaw, tonconnect]);

  return null;
};
