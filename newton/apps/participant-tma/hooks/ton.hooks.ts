import { Address, beginCell, toNano } from "@ton/ton";
import { useTonConnectUI } from "@tonconnect/ui-react";
import { calculateUsdtAmount } from "~/utils/common-helper";
import { USDT_MASTER_ADDRESS } from "~/utils/constants";
import { assetsSdk } from "~/utils/ton.sdk";

interface TransferOptions {
  comment?: string;
}

type TransferType = "USDT" | "TON";

export function useTransferTon() {
  const [tonConnectUI] = useTonConnectUI();

  /**
   * @param des - destination
   *
   * @param amount - amount either in TON or USDT cents
   *
   * @param transferType - USDT or TON
   *
   * @param options - options related to transfer
   */
  return async (des: string, amount: number, transferType: TransferType, { comment }: TransferOptions) => {
    const destinationAddress = Address.parse(des);
    if (transferType === "USDT") {
      /*
       * PREPARE MESSAGE
       * */
      const forwardPayload = beginCell()
        .storeUint(0, 32) // 0 opcode means we have a comment
        .storeStringTail(comment || "onton transfer")
        .endCell();

      const sdk = await assetsSdk(tonConnectUI);

      const jetton = sdk.openJetton(USDT_MASTER_ADDRESS);
      /*
       * TRANSFER
       * */
      const myJettonWallet = await jetton.getWallet(sdk.sender!.address!);
      await myJettonWallet.send(sdk.sender!, destinationAddress, calculateUsdtAmount(amount), {
        notify: {
          payload: forwardPayload,
        },
      });
    } else {
      const body = beginCell()
        .storeUint(0, 32)
        .storeStringTail(comment ?? "onton transfer")
        .endCell()
        .toBoc();

      tonConnectUI.sendTransaction({
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
