import tonCenter, { v2_client } from "@/server/routers/services/tonCenter";
import { Address, Cell, internal, beginCell, contractAddress, StateInit, SendMode, OpenedContract, toNano } from "@ton/core";

import { KeyPair, mnemonicToPrivateKey } from "@ton/crypto";
import { TonClient, WalletContractV4 } from "@ton/ton";

import * as dotenv from "dotenv";

dotenv.config();

// console.log(process.env.MNEMONIC);

export type OpenedWallet = {
  contract: OpenedContract<WalletContractV4>;
  keyPair: KeyPair;
};

export async function openWallet(mnemonic: string[]) {
  const keyPair = await mnemonicToPrivateKey(mnemonic);

  const client = v2_client();

  const wallet = WalletContractV4.create({
    workchain: 0,
    publicKey: keyPair.publicKey,
  });

  const contract = client.open(wallet);
  return { contract, keyPair };
}

function bufferToChunks(buff: Buffer, chunkSize: number) {
  const chunks: Buffer[] = [];
  while (buff.byteLength > 0) {
    chunks.push(buff.subarray(0, chunkSize));
    buff = buff.subarray(chunkSize);
  }
  return chunks;
}
function makeSnakeCell(data: Buffer): Cell {
  const chunks = bufferToChunks(data, 127);

  if (chunks.length === 0) {
    return beginCell().endCell();
  }

  if (chunks.length === 1) {
    return beginCell().storeBuffer(chunks[0]).endCell();
  }

  let curCell = beginCell();

  for (let i = chunks.length - 1; i >= 0; i--) {
    const chunk = chunks[i];

    curCell.storeBuffer(chunk);

    if (i - 1 >= 0) {
      const nextCell = beginCell();
      nextCell.storeRef(curCell);
      curCell = nextCell;
    }
  }

  return curCell.endCell();
}
export function encodeOffChainContent(content: string) {
  let data = Buffer.from(content);
  const offChainPrefix = Buffer.from([0x01]);
  data = Buffer.concat([offChainPrefix, data]);
  return makeSnakeCell(data);
}

export type collectionData = {
  ownerAddress: Address;
  royaltyPercent: number;
  royaltyAddress: Address;
  nextItemIndex: number;
  collectionContentUrl: string;
  commonContentUrl: string;
};

export class NftCollection {
  private collectionData: collectionData;

  constructor(collectionData: collectionData) {
    this.collectionData = collectionData;
  }

  private createCodeCell(): Cell {
    const NftCollectionCodeBoc =
      "te6cckECFAEAAh8AART/APSkE/S88sgLAQIBYgkCAgEgBAMAJbyC32omh9IGmf6mpqGC3oahgsQCASAIBQIBIAcGAC209H2omh9IGmf6mpqGAovgngCOAD4AsAAvtdr9qJofSBpn+pqahg2IOhph+mH/SAYQAEO4tdMe1E0PpA0z/U1NQwECRfBNDUMdQw0HHIywcBzxbMyYAgLNDwoCASAMCwA9Ra8ARwIfAFd4AYyMsFWM8WUAT6AhPLaxLMzMlx+wCAIBIA4NABs+QB0yMsCEsoHy//J0IAAtAHIyz/4KM8WyXAgyMsBE/QA9ADLAMmAE59EGOASK3wAOhpgYC42Eit8H0gGADpj+mf9qJofSBpn+pqahhBCDSenKgpQF1HFBuvgoDoQQhUZYBWuEAIZGWCqALnixJ9AQpltQnlj+WfgOeLZMAgfYBwGyi544L5cMiS4ADxgRLgAXGBEuAB8YEYGYHgAkExIREAA8jhXU1DAQNEEwyFAFzxYTyz/MzMzJ7VTgXwSED/LwACwyNAH6QDBBRMhQBc8WE8s/zMzMye1UAKY1cAPUMI43gED0lm+lII4pBqQggQD6vpPywY/egQGTIaBTJbvy9AL6ANQwIlRLMPAGI7qTAqQC3gSSbCHis+YwMlBEQxPIUAXPFhPLP8zMzMntVABgNQLTP1MTu/LhklMTugH6ANQwKBA0WfAGjhIBpENDyFAFzxYTyz/MzMzJ7VSSXwXiN0CayQ==";
    return Cell.fromBase64(NftCollectionCodeBoc);
  }

  private createDataCell(): Cell {
    const data = this.collectionData;
    const dataCell = beginCell();

    dataCell.storeAddress(data.ownerAddress);
    dataCell.storeUint(data.nextItemIndex, 64);
    const contentCell = beginCell();

    const collectionContent = encodeOffChainContent(data.collectionContentUrl);

    const commonContent = beginCell();
    commonContent.storeBuffer(Buffer.from(data.commonContentUrl));

    contentCell.storeRef(collectionContent);
    contentCell.storeRef(commonContent.asCell());
    dataCell.storeRef(contentCell);
    const NftItemCodeCell = Cell.fromBase64(
      "te6cckECDQEAAdAAART/APSkE/S88sgLAQIBYgMCAAmhH5/gBQICzgcEAgEgBgUAHQDyMs/WM8WAc8WzMntVIAA7O1E0NM/+kAg10nCAJp/AfpA1DAQJBAj4DBwWW1tgAgEgCQgAET6RDBwuvLhTYALXDIhxwCSXwPg0NMDAXGwkl8D4PpA+kAx+gAxcdch+gAx+gAw8AIEs44UMGwiNFIyxwXy4ZUB+kDUMBAj8APgBtMf0z+CEF/MPRRSMLqOhzIQN14yQBPgMDQ0NTWCEC/LJqISuuMCXwSED/LwgCwoAcnCCEIt3FzUFyMv/UATPFhAkgEBwgBDIywVQB88WUAX6AhXLahLLH8s/Im6zlFjPFwGRMuIByQH7AAH2UTXHBfLhkfpAIfAB+kDSADH6AIIK+vCAG6EhlFMVoKHeItcLAcMAIJIGoZE24iDC//LhkiGOPoIQBRONkchQCc8WUAvPFnEkSRRURqBwgBDIywVQB88WUAX6AhXLahLLH8s/Im6zlFjPFwGRMuIByQH7ABBHlBAqN1viDACCAo41JvABghDVMnbbEDdEAG1xcIAQyMsFUAfPFlAF+gIVy2oSyx/LPyJus5RYzxcBkTLiAckB+wCTMDI04lUC8ANqhGIu"
    );
    dataCell.storeRef(NftItemCodeCell);
    const royaltyBase = 1000;
    const royaltyFactor = Math.floor(data.royaltyPercent * royaltyBase);
    const royaltyCell = beginCell();
    royaltyCell.storeUint(royaltyFactor, 16);
    royaltyCell.storeUint(royaltyBase, 16);
    royaltyCell.storeAddress(data.royaltyAddress);
    dataCell.storeRef(royaltyCell);

    return dataCell.endCell();
  }

  public get stateInit(): StateInit {
    const code = this.createCodeCell();
    const data = this.createDataCell();

    return { code, data };
  }

  public get address(): Address {
    return contractAddress(0, this.stateInit);
  }
  public createMintBody(params: mintParams): Cell {
    const body = beginCell();
    body.storeUint(1, 32);
    body.storeUint(params.queryId || 0, 64);
    body.storeUint(params.itemIndex, 64);
    body.storeCoins(params.amount);
    const nftItemContent = beginCell();
    nftItemContent.storeAddress(params.itemOwnerAddress);
    const uriContent = beginCell();
    uriContent.storeBuffer(Buffer.from(params.commonContentUrl));
    nftItemContent.storeRef(uriContent.endCell());
    body.storeRef(nftItemContent.endCell());
    return body.endCell();
  }

  public async deploy(wallet: OpenedWallet) {
    const seqno = await wallet.contract.getSeqno();

    await wallet.contract.sendTransfer({
      seqno,
      secretKey: wallet.keyPair.secretKey,
      messages: [
        internal({
          value: "0.055",
          to: this.address,
          init: this.stateInit,
        }),
      ],
      sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
    });

    return seqno;
  }
  public async topUpBalance(wallet: OpenedWallet, nftAmount: number): Promise<number> {
    const feeAmount = 0.026; // approximate value of fees for 1 transaction in our case
    const seqno = await wallet.contract.getSeqno();
    const amount = nftAmount * feeAmount;

    await wallet.contract.sendTransfer({
      seqno,
      secretKey: wallet.keyPair.secretKey,
      messages: [
        internal({
          value: amount.toString(),
          to: this.address.toString({ bounceable: false }),
          body: new Cell(),
        }),
      ],
      sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
    });

    return seqno;
  }
}

export async function waitSeqno(seqno: number, wallet: OpenedWallet) {
  let seqnoAfter = -1;
  for (let attempt = 0; attempt < 10; attempt++) {
    await sleep(2000);
    seqnoAfter = await wallet.contract.getSeqno();
    if (seqnoAfter == seqno + 1) break;
  }
  return seqnoAfter;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type mintParams = {
  queryId: number | null;
  itemOwnerAddress: Address;
  itemIndex: number;
  amount: bigint;
  commonContentUrl: string;
};

export class NftItem {
  private collection: NftCollection;

  constructor(collection: NftCollection) {
    this.collection = collection;
  }

  public async deploy(wallet: OpenedWallet, params: mintParams, collection_address: string): Promise<number> {
    const seqno = await wallet.contract.getSeqno();
    await wallet.contract.sendTransfer({
      seqno,
      secretKey: wallet.keyPair.secretKey,
      messages: [
        internal({
          value: "0.055",
          to: collection_address,
          body: this.collection.createMintBody(params),
        }),
      ],
      sendMode: SendMode.IGNORE_ERRORS + SendMode.PAY_GAS_SEPARATELY,
    });
    return seqno;
  }
  static async getAddressByIndex(collectionAddress: string, itemIndex: number) {
    const response = await tonCenter.fetchNFTItemsWithRetry("", collectionAddress, "", itemIndex);

    if (response?.nft_items && response?.nft_items.length) {
      return response?.nft_items[0].address;
    }
    return null;
  }
}

export async function mintNFT(owner_address : string , collection_address: string, nftIndex: number | null, nft_metadata_url: string) {
  if (nftIndex === null) {
    const result = await tonCenter.fetchCollection(collection_address);
    nftIndex = Number(result?.nft_collections[0]?.next_item_index);
  }

  let nft_addres = await NftItem.getAddressByIndex(collection_address, nftIndex);
  if (nft_addres) return nft_addres;

  const wallet = await openWallet(process.env.MNEMONIC!.split(" "));

  const collectionData = {
    ownerAddress: wallet.contract.address,
    royaltyPercent: 0.1, // 0.1 = 10%
    royaltyAddress: wallet.contract.address,
    nextItemIndex: nftIndex,
    collectionContentUrl: "",
    commonContentUrl: "",
  };
  const collection = new NftCollection(collectionData);
  const mintParams = {
    queryId: 0,
    itemOwnerAddress: Address.parse(owner_address),
    itemIndex: nftIndex,
    amount: toNano("0.055"),
    commonContentUrl: nft_metadata_url,
  };

  console.log("seq befor mint : ", await wallet.contract.getSeqno());
  const nftItem = new NftItem(collection);
  const seqno = await nftItem.deploy(wallet, mintParams, collection_address);
  console.log(`Successfully deployed the ${nftIndex + 1}th NFT`);
  const seqnoAfter = await waitSeqno(seqno, wallet);
  console.log("seq after mint : ", seqnoAfter);

  await sleep(7000); // just wait to make sure nft is minted
  nft_addres = await NftItem.getAddressByIndex(collection_address, nftIndex);
  if (nft_addres) return nft_addres;

  return null;
}

export async function deployCollection(collectio_metadata_url: string) {
  const wallet = await openWallet(process.env.MNEMONIC!.split(" "));

  console.log("Start deploy of nft collection...");
  const collectionData = {
    ownerAddress: wallet.contract.address,
    royaltyPercent: 0.1, // 0.1 = 10%
    royaltyAddress: wallet.contract.address,
    nextItemIndex: 0,
    collectionContentUrl: collectio_metadata_url,
    commonContentUrl: "",
  };
  const collection = new NftCollection(collectionData);
  let seqno = await collection.deploy(wallet);
  console.log(`Collection deployed: ${collection.address}`);
  await waitSeqno(seqno, wallet);
  await sleep(1500);
  console.log(`Collection deployed Completely ..... `);

  return collection.address.toString();
}

// async function main() {
//   // const url =  await uploadJsonToMinio({} , 'ontonitem');
//   // await deployCollection("https://s.getgems.io/nft/c/626e630d4c1921ba7a0e3b4e/edit/meta-1683207247829.json");
//   const nft = await mintNFT(
//     "kQBw2_yccujzsJoGOhgt24gmWmKYvXYBjha_g8cx7laajyeg",
//     4,
//     "https://bafybeib57q2gh4tlmzbvqd3i2etytfgzbekxrqkwxkg3apyqoko6xag3se.ipfs.w3s.link/3492.json"
//   );
//   // const c = "kQBw2_yccujzsJoGOhgt24gmWmKYvXYBjha_g8cx7laajyeg";
//   // const nft_addres = await NftItem.getAddressByIndex(c, 10);
//   console.log("Addres ", nft);
// }

// main().finally(() => console.log("done"));
