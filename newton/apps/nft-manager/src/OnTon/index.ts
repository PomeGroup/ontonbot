import { mnemonicToWalletKey } from "@ton/crypto";
import {
  OpenedContract,
  TonClient,
  WalletContractV3R1,
  WalletContractV3R2,
  WalletContractV4,
} from "@ton/ton";
import {
  GetItemTransfersResponse,
  GetNftResponse,
  GetTransactionsResponse,
  WalletContract,
} from "src/nft/dto";
import { sleep } from "src/nft/utils/delay";

export class OnTon {
  static tonClient(): TonClient {
    return new TonClient({
      endpoint: process.env.TON_CENTER_ENDPOINT,
      apiKey: process.env.TON_CENTER_TOKEN,
    });
  }

  /**
   * Get latest transactions for an account
   * @param address address which we get latest transactions
   * @param lt Query transactions with lt >= start_lt
   */
  static async getAccountTransactions({
    address,
    start_lt,
    hash,
    attemp = 1,
  }: {
    address: string;
    start_lt?: string;
    hash?: string;
    attemp?: number;
  }): Promise<GetTransactionsResponse> {
    const searchParams = new URLSearchParams({
      account: address,
      limit: "128",
      offset: "0",
      sort: "asc",
      api_key: process.env.TON_CENTER_TOKEN,
      ...(isNaN(parseInt(start_lt)) ? {} : { start_lt }),
      ...(hash ? { hash } : {}),
    });

    // Conditionally add the 'testnet' network if needed
    const network = process.env.TON_NETWORK === "testnet" ? "testnet." : "";

    // Construct the final URL
    const url = `https://${network}toncenter.com/api/v3/transactions?${searchParams.toString()}`;

    console.log(url);
    const res = await fetch(url);

    if (res.status === 429 && attemp < 10) {
      await sleep(1000 * attemp);
      return OnTon.getAccountTransactions({
        address,
        start_lt,
        hash,
        attemp: attemp + 1,
      });
    }

    if (!res.ok) {
      throw res;
    }

    return (await res.json()) as GetTransactionsResponse;
  }

  static async getOnTonWallet() {
    const nmemonicArray = process.env.MNEMONIC.split(" ");

    const { publicKey, secretKey } = await mnemonicToWalletKey(nmemonicArray);
    const workchain = 0;
    let wallet: WalletContract;

    switch (process.env.WALLET_TYPE) {
      case "v3R1":
        wallet = WalletContractV3R1.create({
          workchain,
          publicKey,
        });
        break;

      case "v3R2":
        wallet = WalletContractV3R2.create({
          workchain,
          publicKey,
        });
        break;

      case "v4R1":
      case "v4R2":
      default:
        wallet = WalletContractV4.create({
          workchain,
          publicKey,
        });
        break;
    }

    const walletContract = OnTon.tonClient().open(wallet);

    return { walletContract, wallet, secretKey };
  }

  static async getNftItem(
    collectionAddress: string,
    index: number,
    attempt = 1,
  ): Promise<GetNftResponse> {
    const searchParams = new URLSearchParams({
      collection_address: collectionAddress,
      index: index.toString(),
      limit: "100",
      offset: "0",
      api_key: process.env.TON_CENTER_TOKEN,
    });
    const network = process.env.TON_NETWORK === "testnet" ? "testnet." : "";
    const url = `https://${network}toncenter.com/api/v3/nft/items?${searchParams.toString()}`;
    const res = await fetch(url);

    console.log(url);
    console.log(res.status, res.statusText);
    if (res.status === 429 && attempt < 10) {
      await sleep(1000 * attempt);
      return OnTon.getNftItem(collectionAddress, index, attempt + 1);
    }
    if (!res.ok) {
      console.error(`--- getNftItem error: ${collectionAddress}`, res);
      throw res;
    }

    return (await res.json()) as GetNftResponse;
  }

  static async getItemTransfers(
    item_address: string,
    options: {
      sort?: "asc" | "desc";
      limit?: number;
    },
  ): Promise<GetItemTransfersResponse> {
    const searchParams = new URLSearchParams({
      item_address,
      limit: options.limit?.toString() || "128",
      offset: "0",
      sort: options.sort || "desc",
      api_key: process.env.TON_CENTER_TOKEN,
    });
    const network = process.env.TON_NETWORK === "testnet" ? "testnet." : "";
    const url = `https://${network}toncenter.com/api/v3/nft/transfers?${searchParams.toString()}`;

    console.log(url);
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`--- getItemTransfers error: ${item_address}`, res);
      // handle 429 error
      if (res.status === 429) {
        await sleep(1000);
        return OnTon.getItemTransfers(item_address, options);
      }
      throw res;
    }

    return (await res.json()) as GetItemTransfersResponse;
  }

  static async waitSeqno(
    seqno: number,
    wallet: OpenedContract<WalletContract>,
  ) {
    for (let attempt = 0; attempt < 10; attempt++) {
      await sleep(2000);
      const seqnoAfter = await wallet.getSeqno();
      if (seqnoAfter > seqno) break;
    }
  }

  async waitSeqno(seqno: number, wallet: OpenedContract<WalletContract>) {
    for (let attempt = 0; attempt < 10; attempt++) {
      await sleep(2000);
      const seqnoAfter = await wallet.getSeqno();
      if (seqnoAfter > seqno) break;
    }
  }
}
