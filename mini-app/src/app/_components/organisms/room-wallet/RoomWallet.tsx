"use client";

import React, { useEffect, useState } from "react";

import {
  useTonConnectModal,
  useTonConnectUI,
  useTonWallet,
} from "@tonconnect/ui-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import useWebApp from "@/hooks/useWebApp";
import { address, Address, toNano } from "@ton/core";
import { Loader2 } from "lucide-react";
import { trpc } from "../../../_trpc/client";
import Card from "../../atoms/cards";

const RoomWallet: React.FC<{ walletAddress: string; hash: string }> = ({
  walletAddress,
  hash,
}) => {
  const wallet = useTonWallet();
  const { open } = useTonConnectModal();
  const [tonConnectUI] = useTonConnectUI();
  const WebApp = useWebApp();
  const validatedData = trpc.users.validateUserInitData.useQuery(
    WebApp?.initData || "",
    {
      queryKey: ["users.validateUserInitData", WebApp?.initData || ""],
    }
  );
  const hapticFeedback = WebApp?.HapticFeedback;

  const [distributionLoading, setDistributionLoading] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  const [topupLoading, setTopupLoading] = useState(false);

  const [topUpAmount, setTopUpAmount] = useState("0");
  const [distributeAmount, setDistributeAmount] = useState("");

  const distributeMutation = trpc.events.distribute.useMutation();
  const withdrawMutation = trpc.events.withdraw.useMutation();

  const walletBalance = trpc.events.getWalletBalance.useQuery(walletAddress, {
    refetchInterval: 1000 * 10,
    queryKey: ["events.getWalletBalance", walletAddress],
  }).data;

  const numberOfVisitors = trpc.events.getVisitorsWithWalletsNumber.useQuery(
    {
      event_uuid: hash,
      initData: WebApp?.initData,
    },
    {
      queryKey: [
        "events.getVisitorsWithWalletsNumber",
        {
          event_uuid: hash,
          initData: WebApp?.initData,
        },
      ],
    }
  );

  const addWalletMutation = trpc.users.addWallet.useMutation();

  const amountPerPerson = (walletBalance || 0) / (numberOfVisitors.data || 1);

  useEffect(
    () =>
      tonConnectUI.onStatusChange((walletInfo) => {
        if (walletInfo?.account.address && walletInfo?.account.address !== "") {
          const tonAddress = Address.parseRaw(walletInfo?.account.address!);
          if (validatedData.data?.valid) {
            addWalletMutation.mutate({
              initData: WebApp?.initData,
              wallet: tonAddress.toString({ urlSafe: true }),
            });
          }
        }
      }),
    []
  );

  const handleTopUpClick = async () => {
    hapticFeedback?.impactOccurred("medium");
    if (!wallet) {
      open();
      return;
    }

    try {
      const numAmount = Number.parseFloat(topUpAmount);
      if (isNaN(numAmount)) {
        return;
      }

      const tx = {
        validUntil: Math.floor(Date.now() / 1000) + 60 * 60,
        messages: [
          {
            address: address(walletAddress).toString({
              urlSafe: true,
              bounceable: false,
            }),
            amount: toNano(numAmount).toString(),
          },
        ],
      };

      setTopupLoading(true);
      await tonConnectUI.sendTransaction(tx);

      setTimeout(() => {
        setTopupLoading(false);
      }, 1000 * 3);
    } catch (error) {
      return;
    }
  };

  const handleWithdrawClick = () => {
    hapticFeedback?.impactOccurred("medium");
    if (!wallet) {
      open();
      return;
    }

    async function withdraw() {
      await withdrawMutation.mutateAsync({
        event_uuid: hash,
        initData: WebApp?.initData,
      });
    }

    withdraw();
    setWithdrawLoading(true);

    setTimeout(() => {
      setWithdrawLoading(false);
    }, 1000 * 20);
  };

  const handleDistributeClick = () => {
    hapticFeedback?.impactOccurred("medium");

    if (!wallet) {
      open();
      return;
    }

    async function distribute() {
      await distributeMutation.mutateAsync({
        event_uuid: hash,
        amount: distributeAmount,
        initData: WebApp?.initData,
      });
    }

    distribute();
    setDistributionLoading(true);

    setTimeout(() => {
      setDistributionLoading(false);
    }, 1000 * 20);
  };

  const isSmallBalance = amountPerPerson < 0.1;

  return (
    <div>
      <Card className="flex flex-col items-start mb-2">
        <div>
          Event Balance:{" "}
          <span className="font-bold inline">
            {walletBalance?.toFixed(2)} TON
          </span>
        </div>

        <div>
          Visitors:{" "}
          <span className="font-bold inline">{numberOfVisitors.data}</span>
        </div>
      </Card>

      <div className="w-full  flex flex-col gap-2">
        <div className="flex gap-2">
          <Input
            value={topUpAmount}
            type="number"
            onChange={(e) => {
              setTopUpAmount(e.target.value);
            }}
            placeholder="20 TON"
          />
          <Button
            className="w-full relative"
            variant={"outline"}
            onClick={handleTopUpClick}
          >
            Top Up
            {topupLoading && (
              <Loader2 className="animate-spin absolute right-2 top-2" />
            )}
          </Button>
        </div>

        {walletBalance !== undefined && walletBalance > 0 && (
          <Button
            className="w-full relative"
            variant={"outline"}
            onClick={handleWithdrawClick}
            disabled={withdrawLoading}
          >
            Withdraw
            {withdrawLoading && (
              <Loader2 className="animate-spin absolute right-2 top-2" />
            )}
          </Button>
        )}

        {walletBalance !== undefined && walletBalance > 0 && (
          <div className="flex gap-2">
            <Input
              value={distributeAmount}
              type="number"
              onChange={(e) => {
                setDistributeAmount(e.target.value);
              }}
              placeholder="20 TON"
            />
            <Button
              className="w-full relative"
              variant={"outline"}
              onClick={handleDistributeClick}
              disabled={
                distributionLoading ||
                isSmallBalance ||
                Number.parseFloat(distributeAmount) > amountPerPerson
              }
            >
              Distribute ({distributeAmount || amountPerPerson.toFixed(2)} TON
              per person)
              {distributionLoading && (
                <Loader2 className="animate-spin absolute right-2 top-2" />
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomWallet;
