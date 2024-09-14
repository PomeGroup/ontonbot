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
      initData: WebApp?.initData,
    },
    {
      queryKey: [
        "users.getWallet",
        {
          initData: WebApp?.initData,
        },
      ],
    }
  ).data;
  const webApp = useWebApp();
  const hapticFeedback = webApp?.HapticFeedback;

  const friendlyAddress = useMemo(() => {
    if (userAddress) {
      return Address.parse(userAddress).toString({ bounceable: false });
    }
  }, [userAddress]);

  const [isWalletConnected, setIsWalletConnected] = useState<
    boolean | undefined
  >(undefined);

  useEffect(() => {
    setIsWalletConnected(
      wallet !== null ||
        (userAddress !== "" &&
          userAddress !== null &&
          userAddress !== undefined)
    );
  }, [wallet, userAddress]);

  useEffect(() => {
    try {
      if (isWalletConnected && tonConnectUI.account?.address) {
        addWalletMutation.mutate({
          initData: WebApp?.initData,
          wallet: Address.parse(tonConnectUI.account.address).toString(),
        });
        return;
      }
    } catch {}
  }, [isWalletConnected, tonConnectUI.account?.address]);

  const onConnectClick = async () => {
    if (!tonConnectUI.account) {
      await tonConnectUI.openModal();
      hapticFeedback?.impactOccurred("medium");
    }
  };

  const connectedWallet = useMemo(() => {
    return friendlyAddress?.slice(0, 4) + "..." + friendlyAddress?.slice(-4);
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
