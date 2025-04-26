"use client";

import React, { useEffect, useState } from "react";
import { trpc } from "@/app/_trpc/client";
import { useTonConnectUI } from "@tonconnect/ui-react";
import { beginCell, Address, toNano } from "@ton/ton";
import { toast } from "sonner";

const ONTON_WALLET_ADDRESS = Address.parse("UQAqYUgXUt7xWFj2q8kFM9Y9hFtB4pdDsm2DfEGfCRXPs84q");

interface MergeNftsFlowProps {
  walletAddress: string; // The user’s wallet address
}

export function MergeNftsFlow({ walletAddress }: MergeNftsFlowProps) {
  const [tonConnectUI] = useTonConnectUI();
  const { data, isLoading, refetch } = trpc.campaign.getWalletInfo.useQuery({ walletAddress }, { enabled: !!walletAddress });

  // We'll store exactly one gold/silver/bronze NFT that is "mergeable."
  const [goldNft, setGoldNft] = useState<any | null>(null);
  const [silverNft, setSilverNft] = useState<any | null>(null);
  const [bronzeNft, setBronzeNft] = useState<any | null>(null);

  // We'll also store some counts for display:
  const [totalGold, setTotalGold] = useState<number>(0);
  const [totalSilver, setTotalSilver] = useState<number>(0);
  const [totalBronze, setTotalBronze] = useState<number>(0);
  const [mergeableSets, setMergeableSets] = useState<number>(0);

  useEffect(() => {
    if (!data?.itemsByType) return;

    // Arrays for each collection ID
    const goldArr = data.itemsByType["1"] || [];
    const silverArr = data.itemsByType["2"] || [];
    const bronzeArr = data.itemsByType["3"] || [];

    // 1) Store total counts
    setTotalGold(goldArr.length);
    setTotalSilver(silverArr.length);
    setTotalBronze(bronzeArr.length);

    // 2) Find how many from each are "able_to_merge"
    const goldAbleArr = goldArr.filter((item: any) => item.offChain.mergeStatus === "able_to_merge");
    const silverAbleArr = silverArr.filter((item: any) => item.offChain.mergeStatus === "able_to_merge");
    const bronzeAbleArr = bronzeArr.filter((item: any) => item.offChain.mergeStatus === "able_to_merge");

    // 3) The number of full sets we can merge is the min of these lengths
    const possibleSets = Math.min(goldAbleArr.length, silverAbleArr.length, bronzeAbleArr.length);
    setMergeableSets(possibleSets);

    // 4) For the actual single merge transaction, we pick the *first* from each
    setGoldNft(goldAbleArr[0] || null);
    setSilverNft(silverAbleArr[0] || null);
    setBronzeNft(bronzeAbleArr[0] || null);
  }, [data]);

  const hasAllThree = goldNft && silverNft && bronzeNft;

  /**
   * If the user has at least one gold, silver, and bronze with "able_to_merge",
   * we create a single multi-message transaction transferring them to ONTON_WALLET_ADDRESS,
   * plus a "flag" message for your backend to detect.
   */
  async function handleMergeNfts() {
    if (!hasAllThree) {
      toast.error("Missing gold/silver/bronze NFTs with `able_to_merge` status.");
      return;
    }

    try {
      const messages = [
        createNftTransferMsg(goldNft),
        createNftTransferMsg(silverNft),
        createNftTransferMsg(bronzeNft),
        createMergeFlagMessage(
          `user=${walletAddress}&indexes=[${goldNft.onChain.index},${silverNft.onChain.index},${bronzeNft.onChain.index}]`
        ),
      ];

      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages,
      });

      toast.success("NFTs merge transaction submitted!");
      await refetch();
    } catch (err) {
      console.error("Merge transaction failed:", err);
      toast.error("Failed to merge NFTs.");
    }
  }

  /**
   * Creates the message cell for a standard NFT transfer (#5fcc3d14).
   * The contract expects these fields in exact order.
   */
  function createNftTransferMsg(nft: any) {
    const nftAddr = Address.parse(nft.onChain.address);

    const bodyCell = beginCell()
      .storeUint(0x5fcc3d14, 32) // NFT transfer op code
      .storeUint(0, 64) // query_id
      .storeAddress(ONTON_WALLET_ADDRESS) // newOwner
      .storeAddress(null) // response_destination
      .storeBit(true) // custom_payload => yes
      .storeRef(
        beginCell().storeStringTail(`Name: ${nft.collectionInfo.name}\nImage: ${nft.collectionInfo.image}`).endCell()
      )
      .storeCoins(0) // forward_amount
      .storeBit(false) // forward_payload => no
      .endCell();

    return {
      address: nftAddr.toString(),
      amount: toNano("0.05").toString(), // enough to cover gas for transfer
      payload: bodyCell.toBoc().toString("base64"),
    };
  }

  /**
   * A dummy message to ONTON_WALLET_ADDRESS with a flag comment for your backend/cron job.
   */
  function createMergeFlagMessage(flagComment: string) {
    const bodyCell = beginCell()
      .storeUint(0, 32) // simple "comment" opcode
      .storeStringTail(flagComment)
      .endCell();

    return {
      address: ONTON_WALLET_ADDRESS.toString(),
      amount: toNano("0.001").toString(),
      payload: bodyCell.toBoc().toString("base64"),
    };
  }

  if (isLoading) {
    return <div>Loading wallet data…</div>;
  }

  if (!data) {
    return <div>No wallet info found.</div>;
  }

  return (
    <div className="p-4 bg-slate-50 rounded">
      <h2 className="text-xl font-bold mb-2">Merge NFTs</h2>
      <p>Wallet: {walletAddress}</p>
      <p>Balance: {data.balance} TON</p>

      {/* Show total counts */}
      <div className="mt-4 space-y-1">
        <p>Total Gold: {totalGold}</p>
        <p>Total Silver: {totalSilver}</p>
        <p>Total Bronze: {totalBronze}</p>
        <p className="font-medium">Mergeable Sets: {mergeableSets}</p>
      </div>

      {/* Show details about the single set we can merge right now */}
      <div className="mt-4">
        <p>Gold NFT (able_to_merge): {goldNft ? goldNft.onChain.address : "none"}</p>
        <p>Silver NFT (able_to_merge): {silverNft ? silverNft.onChain.address : "none"}</p>
        <p>Bronze NFT (able_to_merge): {bronzeNft ? bronzeNft.onChain.address : "none"}</p>
      </div>

      <button
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400"
        disabled={!hasAllThree}
        onClick={handleMergeNfts}
      >
        {hasAllThree ? "Merge one set now" : "Cannot Merge (need at least 1 Gold/Silver/Bronze)"}
      </button>
    </div>
  );
}
