import { Address, beginCell, JettonMaster, toNano, TonClient } from "@ton/ton";
import { useTonConnectUI } from "@tonconnect/ui-react";
import { calculateUsdtAmount } from "~/utils/common-helper";
import { isTestnet, JETTON_TRANSFER_GAS_FEES, USDT_MASTER_ADDRESS } from "~/utils/constants";

// NOTE: will not be exported because this will only should be used in client side without api key
const tonClient = new TonClient({
  endpoint: `https://${isTestnet ? "testnet." : ""}toncenter.com/api/v2/jsonRPC`,
});

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
      const forwardPayload = beginCell()
        .storeUint(0, 32) // 0 opcode means we have a comment
        .storeStringTail(comment ?? "onton transfer")
        .endCell();

      const jettonMaster = tonClient.open(new JettonMaster(USDT_MASTER_ADDRESS));

      const body = beginCell()
        .storeUint(0xf8a7ea5, 32) // opcode for jetton transfer
        .storeUint(0, 64) // query id
        .storeCoins(calculateUsdtAmount(amount)) // usdt in cents
        .storeAddress(destinationAddress) // TON wallet destination address
        .storeAddress(destinationAddress) // response excess destination
        .storeBit(0) // no custom payload
        .storeCoins(toNano("0")) // forward amount (if >0, will send notification message)
        .storeBit(1) // we store forwardPayload as a reference
        .storeRef(forwardPayload)
        .endCell();

      tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 360,
        messages: [
          {
            address: jettonMaster.address.toString(),
            amount: toNano(amount).toString(),
            payload: body.toString("base64"),
          },
        ],
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
            amount: JETTON_TRANSFER_GAS_FEES.toString(),
            payload: body.toString("base64"),
          },
        ],
      });
    }
  };
}
