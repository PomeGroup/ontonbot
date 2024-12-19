import { TonClient } from "@ton/ton";
import { atom } from "jotai";
import { isTestnet } from "~/utils/constants";

export const tonClinet = atom<TonClient>(() => {
  const endpoint = `https://${isTestnet ? "testnet." : ""}toncenter.com/api/v2/jsonRPC`;

  const tonClient = new TonClient({ endpoint });

  return tonClient;
});
