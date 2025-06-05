/* ------------------------------------------------------------------ */
/*  app/(navigation)/sample/ClaimSample/page.tsx                      */
/* ------------------------------------------------------------------ */
"use client";
import { setJwt, trpc } from "@/app/_trpc/client";
import { PROOF_PAYLOAD_TTL_MS, TON_PROOF_STORAGE_KEY, WalletNetCHAIN_MAP } from "@/constants";
import { TonProofSavedSession } from "@/types";
import {
  TonConnectButton,
  useIsConnectionRestored,
  useTonAddress,
  useTonConnectModal,
  useTonConnectUI,
  useTonWallet,
  type TonProofItemReplySuccess,
} from "@tonconnect/ui-react";
import { Button } from "konsta/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export default function ClaimSample() {
  /* Ton Connect */
  const [ui] = useTonConnectUI();
  const modal = useTonConnectModal();
  const wallet = useTonWallet();
  const addr = useTonAddress();
  const ready = useIsConnectionRestored();

  /* tRPC */
  const genPayload = trpc.tonProof.generatePayload.useQuery(undefined, { enabled: false });
  const verify = trpc.tonProof.verifyProof.useMutation();
  const overview = trpc.campaign.getClaimOverview.useMutation();
  const claimMut = trpc.campaign.claimOnion.useMutation();

  /* local state */
  const [proof, setProof] = useState<string>(); // stringified proof
  const [jwtOk, setJwtOk] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  /* ----------------------------------------------------------------
     STEP 0  – payload pre-load (when NO wallet connected)
  ---------------------------------------------------------------- */
  useEffect(() => {
    if (!ready || wallet) return;

    const refresh = async () => {
      ui.setConnectRequestParameters({ state: "loading" });
      try {
        const { data } = await genPayload.refetch();
        if (!data?.payload) throw new Error();
        ui.setConnectRequestParameters({ state: "ready", value: { tonProof: data.payload } });
      } catch {
        ui.setConnectRequestParameters(null);
      }
    };

    refresh();
    clearInterval(timerRef.current);
    timerRef.current = setInterval(refresh, PROOF_PAYLOAD_TTL_MS);
    return () => clearInterval(timerRef.current);
  }, [ready, wallet, genPayload, ui]);

  /* ----------------------------------------------------------------
     STEP 1  – wallet connected / restored
  ---------------------------------------------------------------- */
  useEffect(() => {
    if (!ready || !wallet) return;

    /* a) try localStorage first */
    const saved = localStorage.getItem(TON_PROOF_STORAGE_KEY);
    if (saved) {
      const { token, proof } = JSON.parse(saved) as TonProofSavedSession;
      setJwt(token);
      setProof(proof);
      setJwtOk(true);
      return;
    }

    /* b) need to verify fresh proof */
    const reply = wallet.connectItems?.tonProof;
    if (reply && !("error" in reply)) {
      const prf = (reply as TonProofItemReplySuccess).proof;
      verify
        .mutateAsync({
          address: wallet.account.address,
          network: WalletNetCHAIN_MAP[wallet.account.chain] ?? "-239",
          public_key: wallet.account.publicKey ?? "",
          proof: { ...prf, address: wallet.account.address, state_init: "" },
        })
        .then(({ token }) => {
          const session: TonProofSavedSession = { token, proof: JSON.stringify(prf) };
          localStorage.setItem(TON_PROOF_STORAGE_KEY, JSON.stringify(session));

          setJwt(token);
          setProof(session.proof);
          setJwtOk(true);

          toast.success("Wallet verified – fetching overview…");
          overview.mutate({ walletAddress: wallet.account.address, tonProof: session.proof });
        })
        .catch(() => {
          toast.error("Proof invalid – reconnect.");
          ui.disconnect();
        });
    } else {
      toast.error("Proof missing – reconnect.");
      ui.disconnect();
    }
  }, [ready, wallet, verify, ui, overview]);

  /* ----------------------------------------------------------------
     helper actions
  ---------------------------------------------------------------- */
  const fetchOverview = () => {
    if (!addr) return toast.error("Connect first");
    if (!proof) return toast.error("Need proof");
    overview.mutate({ walletAddress: addr, tonProof: proof });
  };

  const claim = () => {
    if (!addr || !proof) return;
    claimMut.mutate({ walletAddress: addr, tonProof: proof });
  };

  /* ----------------------------------------------------------------
     UI
  ---------------------------------------------------------------- */
  return (
    <main className="p-6 max-w-lg mx-auto flex flex-col gap-4">
      <h1 className="text-xl font-bold text-center">ONION Airdrop (Tonkeeper)</h1>

      {addr ? (
        <TonConnectButton className="mx-auto" />
      ) : (
        <Button
          onClick={() => modal.open()}
          className="bg-blue-600 text-white"
        >
          Connect wallet
        </Button>
      )}

      {addr && jwtOk && !overview.data && (
        <Button
          onClick={fetchOverview}
          disabled={overview.isLoading}
          className="bg-indigo-600 text-white"
        >
          {overview.isLoading ? "Loading…" : "Fetch overview"}
        </Button>
      )}

      {overview.data && (
        <>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">{JSON.stringify(overview.data, null, 2)}</pre>
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
