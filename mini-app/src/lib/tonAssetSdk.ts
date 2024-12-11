import { AssetsSDK, PinataStorageParams, createApi, createSender, importKey } from "@ton-community/assets-sdk";
import { Address } from "@ton/core";

async function getSDK() {
  // create an instance of the TonClient4
  const production_env = process.env.ENV === "production" || process.env.ENV === "staging";
  const NETWORK = production_env ? "mainnet" : "testnet";
  const api = await createApi(NETWORK);
  if (!process.env.MNEMONIC) {
    console.log("MNEMONIC NOT Set");
    throw new Error("MNEMONIC NOT Set");
  }

  // create a sender from the wallet (in this case, Highload Wallet V2)
  const keyPair = await importKey(process.env.MNEMONIC);
  const sender = await createSender("highload-v2", keyPair, api);

  // create the SDK instance
  const sdk = AssetsSDK.create({
    api: api, // required, the TonClient4 instance
    sender: sender, // optional, the sender instance (WalletV4, TonConnect or your own)
  });
  return sdk;
}

export async function deployNftCollection(title: string, description: string, image_uri: string) {
  const sdk = await getSDK();
  const collection = await sdk.deployNftCollection(
    {
      collectionContent: {
        name: title,
        description: description,
        image: image_uri,
      },
      commonContent: "https://example.com/nft-items/",
    },
    {
      royaltyParams: { denominator: BigInt(1), numerator: BigInt(1), recipient: Address.parse("") },
    }
  );
  return collection.address
}
