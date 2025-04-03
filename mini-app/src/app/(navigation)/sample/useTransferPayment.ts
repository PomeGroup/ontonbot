import { Address, beginCell, toNano, SenderArguments, storeStateInit } from "@ton/ton";
import { TonConnectUI, useTonConnectUI } from "@tonconnect/ui-react";
import { AssetsSDK, createApi } from "@ton-community/assets-sdk";

type TransferType = "USDT" | "TON" | "STAR";

interface TransferOptions {
  comment?: string;
}

class TonConnectSender {
  private readonly provider: TonConnectUI;

  public get address(): Address | undefined {
    const address = this.provider.account?.address;
    return address ? Address.parse(address) : undefined;
  }

  public constructor(provider: TonConnectUI) {
    this.provider = provider;
  }

  public async send(args: SenderArguments): Promise<void> {
    const validUntil = Math.floor(Date.now() / 1000) + 600;
    const address = args.to.toString({ urlSafe: true, bounceable: true });
    const from = this.address?.toRawString();
    const amount = args.value.toString();

    let stateInit: string | undefined;
    if (args.init) {
      const stateInitCell = beginCell().store(storeStateInit(args.init)).endCell();
      stateInit = stateInitCell.toBoc().toString("base64");
    }

    let payload: string | undefined;
    if (args.body) {
      payload = args.body.toBoc().toString("base64");
    }

    await this.provider.sendTransaction({
      validUntil,
      from,
      messages: [
        {
          address,
          amount,
          stateInit,
          payload,
        },
      ],
    });
  }
}

const NETWORK = "mainnet";

async function assetsSdk(provider: TonConnectUI) {
  const api = await createApi(NETWORK);
  const sender = new TonConnectSender(provider);

  return AssetsSDK.create({
    api,
    sender,
  });
}

export const USDT_MASTER_ADDRESS = Address.parse("EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs");

const calculateUsdtAmount = (usd: number): bigint => BigInt(Math.round(usd * 1_000_000));

/**
 * A hook for transferring TON or USDT.
 *
 * @returns A function that can be called to initiate payment.
 */
export default function useTransferPayment() {
  const [tonConnectUI] = useTonConnectUI();

  return async (destination: string, amount: number, transferType: TransferType, { comment }: TransferOptions) => {
    const destinationAddress = Address.parse(destination);

    if (transferType === "USDT") {
      const forwardPayload = beginCell()
        .storeUint(0, 32)
        .storeStringTail(comment || "onton transfer")
        .endCell();

      const sdk = await assetsSdk(tonConnectUI);

      const jetton = sdk.openJetton(USDT_MASTER_ADDRESS);
      const myJettonWallet = await jetton.getWallet(sdk.sender!.address!);
      await myJettonWallet.send(sdk.sender!, destinationAddress, calculateUsdtAmount(amount), {
        notify: {
          payload: forwardPayload,
        },
      });
    } else {
      // TON transfer
      const body = beginCell()
        .storeUint(0, 32)
        .storeStringTail(comment ?? "onton transfer")
        .endCell()
        .toBoc();

      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 360,
        messages: [
          {
            address: destinationAddress.toString(),
            amount: toNano(amount).toString(),
            payload: body.toString("base64"),
          },
        ],
      });
    }
  };
}
