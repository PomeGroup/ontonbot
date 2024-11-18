import {
  Address,
  beginCell,
  Cell,
  contractAddress,
  internal,
  OpenedContract,
  SendMode,
  StateInit,
  toNano,
} from "@ton/core";
import { TonClient } from "@ton/ton";
import { OnTon } from "src/OnTon";
import { CollectionDeployment, WalletContract } from "../dto";
import { encodeOffChainContent } from "../utils/metadata";
import {
  NftMintItemParams,
  storeNftBatchMintMessage,
} from "./NftBatchMintMessage";
import { createNftItemParamsValue, NftItemParams } from "./NftItemParams";
import { NftRoyaltyParams, storeNftRoyaltyParams } from "./NftRoyaltyParams";

export type CollectionData = {
  ownerAddress: Address;
  royalty: NftRoyaltyParams;
  nextItemIndex: number;
  collectionContentUrl: string;
  commonContentUrl: string;
};

export type CollectionMintItemInput = {
  value: string;
  index: number;
  ownerAddress: Address;
  individualcontent: string;
};

export type NftMetadataType = {
  description: string;
  name: string;
  image: string;
};

// const MintDictValue: DictionaryValue<CollectionMintItemInput> = {
//   serialize(src, builder) {
//     const nftItemMessage = beginCell();

//     const itemContent = beginCell();
//     itemContent.storeStringTail(src.content);

//     nftItemMessage.storeAddress(src.ownerAddress);
//     nftItemMessage.storeRef(itemContent);
//     nftItemMessage.storeAddress(src.authorityAddress);
//     nftItemMessage.storeUint(0, 64);

//     builder.storeCoins(toNano(src.passAmount));
//     builder.storeRef(nftItemMessage);
//   },

//   parse() {
//     return {
//       passAmount: "",
//       index: 0,
//       content: "",
//       authorityAddress: new Address(0, Buffer.from([])),
//       ownerAddress: new Address(0, Buffer.from([])),
//       editorAddress: new Address(0, Buffer.from([])),
//     };
//   },
// };

export class NftCollection {
  public wallet: OpenedContract<WalletContract>;
  public tonClient: TonClient;
  private data: CollectionData;
  private secretKey: Buffer;

  constructor(
    data: CollectionData,
    wallet: OpenedContract<WalletContract>,
    tonClient: TonClient,
    secretKey: Buffer,
  ) {
    this.data = data;
    this.wallet = wallet;
    this.tonClient = tonClient;
    this.secretKey = secretKey;
  }

  public async deploy(): Promise<CollectionDeployment> {
    const seqno = await this.wallet.getSeqno();

    await this.wallet.sendTransfer({
      seqno,
      secretKey: this.secretKey,
      messages: [
        internal({
          value: "0.05",
          to: this.address,
          init: this.stateInit,
        }),
      ],
      sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
    });
    return {
      collectionAddress: this.address.toString(),
      seqno,
    };
  }

  static async deployItemsBatch(
    items: NftMintItemParams<NftItemParams>[],
    address: Address,
    wallet: OpenedContract<WalletContract>,
    secretKey: Buffer,
    options?: {
      value?: bigint;
      queryId?: bigint;
    },
  ): Promise<number> {
    const seqno = await wallet.getSeqno();

    const totalAmount = await this.getBatchMintingFeesAmount(
      address,
      items.length,
    );

    const body = beginCell()
      .store(
        storeNftBatchMintMessage(
          {
            queryId: options?.queryId ?? 0n,
            requests: items.map((item) => ({
              index: item.index,
              params: item,
              value: item.value ?? toNano("0.05"),
            })),
          },
          createNftItemParamsValue().store,
        ),
      )
      .endCell();

    await wallet.sendTransfer({
      seqno,
      secretKey,
      messages: [
        internal({
          bounce: true,
          value: totalAmount,
          to: address,
          body,
        }),
      ],
      sendMode: SendMode.IGNORE_ERRORS + SendMode.PAY_GAS_SEPARATELY,
    });
    return seqno;
  }

  static async getNFTAddressByIndex(
    index: number,
    collectionAddress: Address,
    tonClient: TonClient,
  ) {
    const data = await tonClient.runMethod(
      collectionAddress,
      "get_nft_address_by_index",
      [
        {
          type: "int",
          value: BigInt(index),
        },
      ],
    );

    return data.stack.readAddress();
  }

  public async changeOwnership(newOwner: Address): Promise<number> {
    const seqno = await this.wallet.getSeqno();
    const body = beginCell();

    body.storeUint(3, 32);
    body.storeUint(0, 64);
    body.storeAddress(newOwner);

    const amount = "0.05";

    await this.wallet.sendTransfer({
      seqno,
      secretKey: this.secretKey,
      messages: [
        internal({
          value: amount,
          to: this.address,
          body: body.endCell(),
        }),
      ],
      sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
    });

    return seqno;
  }

  static async getLastNftIndex(
    collectionAddress: Address,
    tonClient: TonClient,
  ) {
    const collectionData = await tonClient.runMethod(
      collectionAddress,
      "get_collection_data",
    );
    const lastNftIndex = collectionData.stack.readNumber() - 1;
    return lastNftIndex;
  }

  // async getData(provider: ContractProvider): Promise<NftCollectionData> {
  //   const ret = await provider.get("get_collection_data", []);
  //   return {
  //     nextItemIndex: ret.stack.readBigNumber(),
  //     content: ret.stack.readCell(),
  //     owner: ret.stack.readAddressOpt(),
  //   };
  // }

  static async getLastNftMetadata(
    collectionAddress: Address,
    tonClient: TonClient,
  ) {
    const lastNftIndex = await NftCollection.getLastNftIndex(
      collectionAddress,
      tonClient,
    );

    const lastNftAddress = (
      await tonClient.runMethod(collectionAddress, "get_nft_address_by_index", [
        { type: "int", value: BigInt(lastNftIndex) },
      ])
    ).stack.readAddress();

    const lastNftData = await tonClient.runMethod(
      lastNftAddress,
      "get_nft_data",
    );
    lastNftData.stack.skip(4);

    const lastNftContent = lastNftData.stack.readCell();

    const nftContent = await tonClient.runMethod(
      collectionAddress,
      "get_nft_content",
      [
        { type: "int", value: BigInt(lastNftIndex) },
        { type: "cell", cell: lastNftContent },
      ],
    );
    const commonContent = nftContent.stack.readCell().asSlice();
    commonContent.loadUint(8);
    commonContent.loadStringRefTail();

    const metadataURL =
      commonContent.loadStringTail() +
      lastNftContent.beginParse().loadStringTail();

    const response = await fetch(metadataURL, {
      signal: AbortSignal.timeout(3_000_000),
    });
    const metadata: NftMetadataType = await response.json();

    return { metadata, metadataURL };
  }

  static async isOwner(
    collectionAddress: Address,
    walletAddress: Address,
  ): Promise<boolean> {
    try {
      const collectionData = await OnTon.tonClient().runMethod(
        collectionAddress,
        "get_collection_data",
      );
      collectionData.stack.pop();
      collectionData.stack.pop();
      const ownerAddress = collectionData.stack.readAddress();
      return ownerAddress.equals(walletAddress);
    } catch {
      return false;
    }
  }

  static async getBatchMintingFeesAmount(
    collectionAddress: Address,
    batchSize: number,
  ): Promise<bigint> {
    let mintAmount = toNano("0.055") * BigInt(batchSize);

    // const collectionBalance =
    //   (await OnTon.tonClient().getBalance(collectionAddress)) - toNano("0.3");

    // if (collectionBalance > mintAmount) {
    //   mintAmount = 0n;
    // } else if (collectionBalance > 0) {
    //   mintAmount -= collectionBalance;
    // }

    return mintAmount;
  }

  public get stateInit(): StateInit {
    const code = this.createCodeCell();
    const data = this.createDataCell();

    return { code, data };
  }

  public get address(): Address {
    return contractAddress(0, this.stateInit);
  }

  private createCodeCell(): Cell {
    const NftCollectionCodeBoc =
      "te6ccgECFAEAAh8AART/APSkE/S88sgLAQIBYgIDAgLNBAUCASAODwTn0QY4BIrfAA6GmBgLjYSK3wfSAYAOmP6Z/2omh9IGmf6mpqGEEINJ6cqClAXUcUG6+CgOhBCFRlgFa4QAhkZYKoAueLEn0BCmW1CeWP5Z+A54tkwCB9gHAbKLnjgvlwyJLgAPGBEuABcYES4AHxgRgZgeACQGBwgJAgEgCgsAYDUC0z9TE7vy4ZJTE7oB+gDUMCgQNFnwBo4SAaRDQ8hQBc8WE8s/zMzMye1Ukl8F4gCmNXAD1DCON4BA9JZvpSCOKQakIIEA+r6T8sGP3oEBkyGgUyW78vQC+gDUMCJUSzDwBiO6kwKkAt4Ekmwh4rPmMDJQREMTyFAFzxYTyz/MzMzJ7VQALDI0AfpAMEFEyFAFzxYTyz/MzMzJ7VQAPI4V1NQwEDRBMMhQBc8WE8s/zMzMye1U4F8EhA/y8AIBIAwNAD1FrwBHAh8AV3gBjIywVYzxZQBPoCE8trEszMyXH7AIAC0AcjLP/gozxbJcCDIywET9AD0AMsAyYAAbPkAdMjLAhLKB8v/ydCACASAQEQAlvILfaiaH0gaZ/qamoYLehqGCxABDuLXTHtRND6QNM/1NTUMBAkXwTQ1DHUMNBxyMsHAc8WzMmAIBIBITAC+12v2omh9IGmf6mpqGDYg6GmH6Yf9IBhAALbT0faiaH0gaZ/qamoYCi+CeAI4APgCw";
    return Cell.fromBase64(NftCollectionCodeBoc);
  }

  private createDataCell(): Cell {
    const data = this.data;
    const dataCell = beginCell();

    dataCell.storeAddress(data.ownerAddress);
    dataCell.storeUint(data.nextItemIndex, 64);

    const contentCell = beginCell();

    const collectionContent = encodeOffChainContent(data.collectionContentUrl);

    const commonContent = encodeOffChainContent(data.commonContentUrl, false);

    contentCell.storeRef(collectionContent);
    contentCell.storeRef(commonContent);
    dataCell.storeRef(contentCell);

    const NftItemCodeCell = Cell.fromBase64(
      "te6ccgECDgEAAdwAART/APSkE/S88sgLAQIBYgIDAgLOBAUACaEfn+AFAgEgBgcCASAMDQLPDIhxwCSXwPg0NMDAXGwkl8D4PpA+kAx+gAxcdch+gAx+gAwc6m0APACBLOOFDBsIjRSMscF8uGVAfpA1DAQI/AD4AbTH9M/ghBfzD0UUjC64wIwNDQ1NYIQL8smohK64wJfBIQP8vCAICQARPpEMHC68uFNgAqwyEDdeMkATUTXHBfLhkfpAIfAB+kDSADH6ACDXScIA8uLEggr68IAboSGUUxWgod4i1wsBwwAgkgahkTbiIML/8uGSIZQQKjdb4w0CkzAyNOMNVQLwAwoLAHJwghCLdxc1BcjL/1AEzxYQJIBAcIAQyMsFUAfPFlAF+gIVy2oSyx/LPyJus5RYzxcBkTLiAckB+wAAfIIQBRONkchQCc8WUAvPFnEkSRRURqBwgBDIywVQB88WUAX6AhXLahLLH8s/Im6zlFjPFwGRMuIByQH7ABBHAGom8AGCENUydtsQN0QAbXFwgBDIywVQB88WUAX6AhXLahLLH8s/Im6zlFjPFwGRMuIByQH7AAA7O1E0NM/+kAg10nCAJp/AfpA1DAQJBAj4DBwWW1tgAB0A8jLP1jPFgHPFszJ7VSA=",
    );
    dataCell.storeRef(NftItemCodeCell);

    // const royaltyBase = 1000;
    // const royaltyFactor = Math.floor(data.royaltyPercent * royaltyBase);

    // const royaltyCell = beginCell();
    // royaltyCell.storeUint(royaltyFactor, 16);
    // royaltyCell.storeUint(royaltyBase, 16);
    // royaltyCell.storeAddress(data.royaltyAddress);

    const royaltyCell = beginCell()
      .store(storeNftRoyaltyParams(data.royalty))
      .endCell();

    dataCell.storeRef(royaltyCell);

    return dataCell.endCell();
  }
}
