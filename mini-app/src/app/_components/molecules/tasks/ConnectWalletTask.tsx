"use client";

import { trpc } from "@/app/_trpc/client";
import useWebApp from "@/hooks/useWebApp";
import { Address } from "@ton/core";
import { useTonConnectUI, useTonWallet } from "@tonconnect/ui-react";
import { useEffect, useMemo, useState } from "react";
import Tasks from ".";

const ConnectWalletTask = () => {
  const WebApp = useWebApp();
  const wallet = useTonWallet();
  const [tonConnectUI] = useTonConnectUI();
  const trpcUtils = trpc.useUtils();

  const addWalletMutation = trpc.users.addWallet.useMutation({
    onSuccess: () => {
      trpcUtils.users.getVisitorReward.invalidate({}, { refetchType: "all" });
      trpcUtils.users.getWallet.invalidate({}, { refetchType: "all" });
    },
  });

  const userAddress = trpc.users.getWallet.useQuery(
    {
      init_data: WebApp?.initData!,
      wallet_address: wallet?.account.address!,
    },
    {
      queryKey: [
        "users.getWallet",
        {
          init_data: WebApp?.initData!,
          wallet_address: wallet?.account.address!,
        },
      ],
      enabled: Boolean(WebApp?.initData) && Boolean(wallet?.account.address),
      retry: false,
    }
  );

  const webApp = useWebApp();
  const hapticFeedback = webApp?.HapticFeedback;

  const friendlyAddress = useMemo(() => {
    if (userAddress.data) {
      return Address.parse(userAddress.data).toString({ bounceable: false });
    }
  }, [userAddress.data]);

  const [isWalletConnected, setIsWalletConnected] = useState<
    boolean | undefined
  >(undefined);

  useEffect(() => {
    try {
      if (tonConnectUI.account?.address && userAddress.data) {
        setIsWalletConnected(Boolean(Address.parse(userAddress.data)));
      } else {
        setIsWalletConnected(false);
      }
    } catch {
      setIsWalletConnected(false);
    }
  }, [wallet, userAddress.data]);

  useEffect(() => {
    try {
      if (tonConnectUI.account?.address && webApp?.initData) {
        addWalletMutation.mutate({
          init_data: webApp.initData,
          wallet: Address.parse(tonConnectUI.account.address).toString(),
        });
      }
    } catch {}
  }, [isWalletConnected, tonConnectUI.account?.address, webApp?.initData]);

  const onConnectClick = async () => {
    if (!tonConnectUI.account) {
      await tonConnectUI.openModal();
      hapticFeedback?.impactOccurred("medium");
    }
  };

  const connectedWallet = useMemo(() => {
    return `${friendlyAddress?.slice(0, 4)}...${friendlyAddress?.slice(-4)}`;
  }, [friendlyAddress]);

  return (
    <Tasks.Generic
      title="Connect TON Wallet"
      description={
        isWalletConnected
          ? `You have connected your wallet (${connectedWallet})`
          : "Register at event and receive an SBT"
      }
      completed={isWalletConnected}
      defaultEmoji="👛"
      onClick={(!isWalletConnected && onConnectClick) || undefined}
    />
  );
};

export default ConnectWalletTask;
