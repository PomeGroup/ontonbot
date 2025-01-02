import { AssetsSDK, createApi } from "@ton-community/assets-sdk";
import { isTestnet } from "./constants";
import { Address, Sender, SenderArguments, beginCell, storeStateInit } from "@ton/ton";
import { TonConnectUI } from "@tonconnect/ui-react";

/**
 * Sender implementation for TonConnect.
 * This class is used to send messages using the TonConnect UI.
 */
class TonConnectSender implements Sender {
  /**
   * The TonConnect UI instance.
   * @private
   */
  private readonly provider: TonConnectUI;

  /**
   * The address of the current account.
   */
  public get address(): Address | undefined {
    const address = this.provider.account?.address;
    return address ? Address.parse(address) : undefined;
  }

  /**
   * Creates a new TonConnectSender.
   * @param provider
   */
  public constructor(provider: TonConnectUI) {
    this.provider = provider;
  }

  /**
   * Sends a message using the TonConnect UI.
   * @param args
   */
  public async send(args: SenderArguments): Promise<void> {
    // The transaction is valid for 10 minutes.
    const validUntil = Math.floor(Date.now() / 1000) + 600;

    // The address of the recipient, should be in bounceable format for all smart contracts.
    const address = args.to.toString({ urlSafe: true, bounceable: true });

    // The address of the sender, if available.
    const from = this.address?.toRawString();

    // The amount to send in nano tokens.
    const amount = args.value.toString();

    // The state init cell for the contract.
    let stateInit: string | undefined;
    if (args.init) {
      // State init cell for the contract.
      const stateInitCell = beginCell().store(storeStateInit(args.init)).endCell();
      // Convert the state init cell to boc base64.
      stateInit = stateInitCell.toBoc().toString("base64");
    }

    // The payload for the message.
    let payload: string | undefined;
    if (args.body) {
      // Convert the message body to boc base64.
      payload = args.body.toBoc().toString("base64");
    }

    // Send the message using the TonConnect UI and wait for the message to be sent.
    await this.provider.sendTransaction({
      validUntil: validUntil,
      from: from,
      messages: [
        {
          address: address,
          amount: amount,
          stateInit: stateInit,
          payload: payload,
        },
      ],
    });
  }
}

const NETWORK = isTestnet ? "testnet" : "mainnet";

export const assetsSdk = async (provider: TonConnectUI) => {
  // __AUTO_GENERATED_PRINT_VAR_START__
  console.log("assetsSdk NETWORK: %s", NETWORK); // __AUTO_GENERATED_PRINT_VAR_END__
  const api = await createApi(NETWORK);
  // __AUTO_GENERATED_PRINT_VAR_START__
  console.log("assetsSdk api: %s", api); // __AUTO_GENERATED_PRINT_VAR_END__
  const sender = new TonConnectSender(provider);

  return AssetsSDK.create({
    api: api,
    sender: sender,
  });
};
