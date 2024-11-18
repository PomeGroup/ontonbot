import { Address } from "@ton/core";
import { TonClient } from "@ton/ton";

interface NftItemData {
  index: number;
  ownerAddress: Address;
  collectionAddress: Address;
  metadata_url: string;
}

export class NftItem {
  static async getContent(
    nftItemAddress: Address,
    tonClient: TonClient,
  ): Promise<NftItemData> {
    const lastNftData = await tonClient.runMethod(
      nftItemAddress,
      "get_nft_data",
    );

    lastNftData.stack.skip(1);

    const index = lastNftData.stack.readNumber();
    const collectionAddress = lastNftData.stack.readAddress();
    const ownerAddress = lastNftData.stack.readAddress();

    const individualItemContent = lastNftData.stack.readCell();

    const nftContent = await tonClient.runMethod(
      collectionAddress,
      "get_nft_content",
      [
        { type: "int", value: BigInt(index) },
        { type: "cell", cell: individualItemContent },
      ],
    );
    const commonContent = nftContent.stack.readCell().asSlice();
    commonContent.loadUint(8);
    commonContent.loadStringRefTail();

    const metadata_url = individualItemContent.beginParse().loadStringTail();

    // return { metadata, metadataURL };

    return {
      index,
      collectionAddress,
      ownerAddress,
      metadata_url,
    };
  }
}
