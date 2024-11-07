import { useContext, useEffect, useRef } from "react";
import { useIsConnectionRestored, useTonConnectUI, useTonWallet } from "@tonconnect/ui-react";
import { TonProofContext } from "~/components/TonProofProvider";
import { tonProofServices } from "~/services/ton-proof.services";
import { env } from "~/env.mjs";
import { toast } from "@ui/base/sonner";

const localStorageKey = 'onton-proof-auth-token';
const payloadTTLMS = 1000 * 60 * 60 * 24 * 7;

export function useProofAuth() {
  const { setToken } = useContext(TonProofContext);
  const isConnectionRestored = useIsConnectionRestored();
  const wallet = useTonWallet();
  const [tonConnectUI] = useTonConnectUI();
  const interval = useRef<ReturnType<typeof setInterval> | undefined>();

  useEffect(() => {
    if (!isConnectionRestored || !setToken) {
      return;
    }

    clearInterval(interval.current);

    if (!wallet) {
      localStorage.removeItem(localStorageKey);
      setToken(null);

      const refreshPayload = async () => {
        tonConnectUI.setConnectRequestParameters({ state: 'loading' });

        const value = (await tonProofServices.generatePayload()).payload

        if (!value) {
          tonConnectUI.setConnectRequestParameters(null);
        } else {
          tonConnectUI.setConnectRequestParameters({
            state: 'ready', value: {
              tonProof: value
            }
          });
        }
      }

      refreshPayload();
      setInterval(refreshPayload, payloadTTLMS);
      return;
    }

    const token = localStorage.getItem(localStorageKey);
    if (token) {
      setToken(token);
      return;
    }

    if (wallet.connectItems?.tonProof && !('error' in wallet.connectItems.tonProof)) {
      tonProofServices.checkProof({
        proof: { ...wallet.connectItems.tonProof.proof, state_init: wallet.account.walletStateInit },
        // @ts-ignore
        network: env.NEXT_PUBLIC_TON_NETWROK === 'testnet' ? '-3' : '-239',
        public_key: wallet.account.publicKey!,
        address: wallet.account.address
      }).then(result => {
        setToken(result.token);
        localStorage.setItem(localStorageKey, result.token);
      }).catch(() => {
        toast.error('Wallet session expired, Reconnect.')
        tonConnectUI.disconnect();
      })
    } else {
      toast.error('Wallet session expired, Reconnect.');
      tonConnectUI.disconnect();
    }
  }, [wallet, isConnectionRestored, setToken])
}
