"use client";
import React, { useCallback, useEffect } from "react";
import { Address } from "@ton/core";
import { useTonAddress, useTonConnectModal, useTonConnectUI, TonConnectButton } from "@tonconnect/ui-react";
import type { ConnectedWallet } from "@tonconnect/ui-react";
import { toast } from "sonner";

import { trpc } from "@/app/_trpc/client";

export default function SecureClaimWalletCard() {
  /* TonConnect -------------------------------------------------------- */
  const tonAddr = useTonAddress();
  const modal = useTonConnectModal();
  const [ui] = useTonConnectUI(); // first item is the UI instance

  /* TRPC -------------------------------------------------------------- */
  const getChallenge = trpc.campaign.getTonProofChallenge.useQuery(undefined, {
    enabled: false,
  });

  const claimMutation = trpc.campaign.claimOnion.useMutation({
    onSuccess: () => toast.success("ONION claimed!"),
    onError: (e) => toast.error(e.message),
  });

  /* click handler ----------------------------------------------------- */
  const handleClaim = useCallback(async () => {
    try {
      /* 1️⃣ fetch one-time challenge */
      const { data } = await getChallenge.refetch();
      if (!data?.challenge) throw new Error("No challenge");

      /* 2️⃣ set connect-request params (tonProof is STRING!) */
      ui.setConnectRequestParameters({
        state: "ready",
        value: { tonProof: data.challenge },
      });

      /* 3️⃣ open modal – user signs */
      modal.open();
      /* proof handled in onStatusChange */
    } catch (err: any) {
      toast.error(err.message ?? "Cancelled");
    }
  }, [getChallenge, ui, modal]);

  /* listen for wallet connect + proof -------------------------------- */
  useEffect(() => {
    const off = ui.onStatusChange(async (wallet: ConnectedWallet | null) => {
      if (!wallet) return; // disconnected / still loading

      /* tonProof comes in wallet.connectItems.tonProof */
      const proof = wallet.connectItems?.tonProof;
      if (!proof) return; // no proof yet

      try {
        const walletAddress = wallet.account.address;
        Address.parse(walletAddress); // checksum validate

        await claimMutation.mutateAsync({
          walletAddress,
          tonProof: JSON.stringify(proof),
        });
      } catch (e: any) {
        toast.error(e.message ?? "Claim failed");
      } finally {
        ui.setConnectRequestParameters(null); // clear for next call
      }
    });
    return off; // cleanup on unmount
  }, [ui, claimMutation]);

  /* render ------------------------------------------------------------ */
  return (
    <div className="w-full p-4 mb-8 border border-gray-300 rounded shadow-sm">
      <h3 className="font-semibold mb-4">Secure ONION Claim</h3>

      {tonAddr ? (
        <>
          <TonConnectButton className="mb-4" />
          <button
            onClick={handleClaim}
            disabled={claimMutation.isLoading}
            className="w-full py-3 rounded bg-green-600 text-white disabled:opacity-60"
          >
            {claimMutation.isLoading ? "Claiming…" : "Claim ONION"}
          </button>
        </>
      ) : (
        <button
          onClick={() => modal.open()}
          className="w-full py-3 rounded bg-blue-600 text-white"
        >
          Connect Wallet
        </button>
      )}
    </div>
  );
}
