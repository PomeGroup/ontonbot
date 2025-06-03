/* ------------------------------------------------------------------ */
/*  app/(navigation)/sample/ClaimSample/page.tsx                      */
/* ------------------------------------------------------------------ */

"use client";

import React, { useCallback, useEffect, useState } from "react";
import { TonConnectButton, useTonAddress, useTonConnectModal, useTonConnectUI } from "@tonconnect/ui-react";
import type { TonProofItemReplySuccess } from "@tonconnect/ui-react";
import { Button } from "konsta/react";
import { toast } from "sonner";

import { trpc, setJwt } from "@/app/_trpc/client";

/* -------------------------------------------------------- */
/*  Helpers                                                 */
/* -------------------------------------------------------- */

const CHAIN_MAP: Record<number | string, "-239" | "-3"> = {
  // Ton Connect v2 can return 0, -239 or -3 depending on the wallet
  0: "-239", // main-net
  "-239": "-239",
  "-3": "-3", // test-net
};

/** static domain we show to the wallet while asking for a proof */
const PROOF_DOMAIN = { value: "onton.tg", lengthBytes: 8 };

/* -------------------------------------------------------- */
/*  Component                                               */
/* -------------------------------------------------------- */

export default function ClaimSample() {
  /* Ton Connect handles */
  const [ui] = useTonConnectUI();
  const modal = useTonConnectModal();
  const address = useTonAddress(); // '' until connected

  /* tRPC hooks */
  const genPayload = trpc.tonProof.generatePayload.useQuery(undefined, { enabled: false });
  const verifyProof = trpc.tonProof.verifyProof.useMutation();
  const overviewMut = trpc.campaign.getClaimOverview.useMutation();
  const claimMut = trpc.campaign.claimOnion.useMutation();

  /* local state */
  const [proofJSON, setProofJSON] = useState<string>(); // stringified proof

  /* -------------------------------------------------- */
  /* 1 — connect (or just ask to sign)                  */
  /* -------------------------------------------------- */
  const connectAndSign = useCallback(async () => {
    /* ① fetch fresh payload from the backend */
    const { data } = await genPayload.refetch();
    if (!data?.payload) return toast.error("Server payload unavailable");

    /* ② ask the wallet to sign that payload */
    ui.setConnectRequestParameters({
      state: "ready",
      value: {
        tonProof: JSON.stringify({
          domain: PROOF_DOMAIN, // { value: 'onton.tg', lengthBytes: 8 }
          payload: data.payload, // JWT you got from backend
        }),
      },
    });

    if (ui.connected) {
      // wallet already connected – we only need the “sign” screen
      await ui.openModal();
    } else {
      // connect + sign in one step
      await modal.open();
    }

    ui.setConnectRequestParameters(null); // cleanup
  }, [genPayload, ui, modal]);

  /* -------------------------------------------------- */
  /* 1½ — wait for the proof from the wallet            */
  /* -------------------------------------------------- */
  useEffect(() => {
    const unsubscribe = ui.onStatusChange(async (w) => {
      console.log("wwwwww", w);
      if (!w || !w.connectItems?.tonProof) return; // still no proof
      const proof = (w.connectItems.tonProof as TonProofItemReplySuccess).proof;

      try {
        /* ② verify proof on the backend */
        const { token } = await verifyProof.mutateAsync({
          address: w.account.address,
          network: CHAIN_MAP[w.account.chain] ?? "-239",
          public_key: w.account.publicKey ?? "",
          proof: { ...proof, state_init: "" }, // state_init optional
        });

        setJwt(token); // future tRPC calls → auth’d
        setProofJSON(JSON.stringify(proof));

        toast.success("Wallet verified – fetching overview…");

        /* ③ immediately fetch overview for this wallet */
        overviewMut.mutate({
          walletAddress: w.account.address,
          tonProof: JSON.stringify(proof),
        });
      } catch (err: any) {
        toast.error(err?.message ?? "Verification failed");
      }
    });

    return unsubscribe;
  }, [ui, verifyProof, overviewMut]);

  /* -------------------------------------------------- */
  /* (re)fetch overview on demand                       */
  /* -------------------------------------------------- */
  const fetchOverview = () => {
    if (!address) return toast.error("Connect wallet first");
    if (!proofJSON) return toast.error("Need a signed proof");
    overviewMut.mutate({ walletAddress: address, tonProof: proofJSON });
  };

  /* -------------------------------------------------- */
  /* claim                                              */
  /* -------------------------------------------------- */
  const claim = () => {
    if (!address || !proofJSON) return;
    claimMut.mutate({ walletAddress: address, tonProof: proofJSON });
  };

  /* -------------------------------------------------- */
  /*  UI                                                */
  /* -------------------------------------------------- */
  return (
    <main className="p-6 max-w-lg mx-auto flex flex-col gap-4">
      <h1 className="text-xl text-center font-bold">ONION Airdrop (Tonkeeper)</h1>

      {/* connect / sign */}
      {address ? (
        <TonConnectButton className="mx-auto" />
      ) : (
        <Button
          onClick={connectAndSign}
          className="bg-blue-600 text-white"
        >
          Connect wallet&nbsp;&amp;&nbsp;sign
        </Button>
      )}

      {/* fetch overview, only after we already have a proof */}
      {address && !overviewMut.data && proofJSON && (
        <Button
          onClick={fetchOverview}
          disabled={overviewMut.isLoading}
          className="bg-indigo-600 text-white"
        >
          {overviewMut.isLoading ? "Loading…" : "Fetch overview"}
        </Button>
      )}

      {/* overview */}
      {overviewMut.data && (
        <>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">{JSON.stringify(overviewMut.data, null, 2)}</pre>

          <Button
            onClick={claim}
            disabled={claimMut.isLoading}
            className="bg-green-600 text-white"
          >
            {claimMut.isLoading ? "Claiming…" : "Claim ONION"}
          </Button>
        </>
      )}
    </main>
  );
}
