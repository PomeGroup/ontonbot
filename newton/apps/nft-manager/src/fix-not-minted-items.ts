import { NFTItem, PrismaClient } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { Address } from "@ton/core";
import { AxiosError } from "axios";
import "dotenv/config";
import { PrismaService } from "nestjs-prisma";
import { OnTon } from "./OnTon";
import { MinioClientService } from "./minio/minio.service";
import { NftCollection } from "./nft/contracts/NftCollection";
import { NftItem, participantData } from "./nft/dto";
import { MetaDataService } from "./nft/metadata.service";
import { NFTService } from "./nft/nft.service";

const prisma = new PrismaClient();
const minioClient = new MinioClientService();
const metadataService = new MetaDataService(minioClient);
const prismaService = new PrismaService();
const mintService = new NFTService(metadataService, prismaService, minioClient);

const cachedBlockChainItems = new Map<string, NftItem>();

let chacheUsed = 0;
const mintQueue: Awaited<ReturnType<typeof processNFTItem>>[] = [];

console.log("env", process.env);
// database url
const databaseUrl = process.env.DATABASE_URL;
console.log("databaseUrl", databaseUrl);

(async () => {
  // get all nft items from database older than 21 sep 2024 13 pm
  const nftItemsDbData = await prisma.nFTItem.findMany({
    where: {
      create_at: {
        lt: new Date("2024-09-21T13:00:00.000Z"),
      },
      state: "minted",
    },
  });

  const counts = {};
  const duplicates: NFTItem[] = [];

  nftItemsDbData.forEach((item) => {
    const key = `${item.collection_id}-${item.index}`;
    counts[key] = (counts[key] || 0) + 1;
    if (counts[key] > 1) {
      duplicates.push(item);
    }
  });

  // Add first occurrences of duplicates
  nftItemsDbData.forEach((item) => {
    const key = `${item.collection_id}-${item.index}`;
    if (counts[key] > 1 && !duplicates.findIndex((i) => i.id === item.id)) {
      duplicates.push(item);
    }
  });

  const nftItems = duplicates;

  console.log("nftItems", nftItems.length);

  for (const nftItem of nftItems) {
    const data = await processNFTItem(nftItem);
    if (data) mintQueue.push(data);
  }

  const nftItemsByCollection = new Map<string, participantData[]>();
  // do a for loop and add map them by their common collection address from mint queue
  for (const nftItem of mintQueue) {
    if (!nftItemsByCollection.has(nftItem.collection.address)) {
      nftItemsByCollection.set(nftItem.collection.address, []);
    }
    nftItemsByCollection
      .get(nftItem.collection.address)
      ?.push(nftItem.mint_data);
  }

  // create 100 item chunks from each collection
  const chunksByCollection = new Map<string, participantData[][]>();
  for (const [collectionAddress, nftItems] of nftItemsByCollection.entries()) {
    const chunks: participantData[][] = [];
    for (let i = 0; i < nftItems.length; i += 100) {
      const chunk = nftItems.slice(i, i + 100);
      chunks.push(chunk);
    }

    chunksByCollection.set(collectionAddress, chunks);
  }

  // mint all chunks in all collections
  for (const [
    collectionAddressString,
    chunks,
  ] of chunksByCollection.entries()) {
    for (const chunk of chunks) {
      try {
        const nftCollection = await prisma.nFTCollection.findUnique({
          where: {
            address: collectionAddressString,
          },
        });
        const metadata = {
          //@ts-ignore
          name: nftCollection.item_meta_data?.name,
          //@ts-ignore
          description: nftCollection.item_meta_data?.description,
          //@ts-ignore
          image_url: nftCollection.item_meta_data?.image,
        };

        const collectionAddress = Address.parse(collectionAddressString);

        const lastNftIndex = await NftCollection.getLastNftIndex(
          collectionAddress,
          OnTon.tonClient(),
        );

        const chunksWithIndex = chunk.map((item, index) => ({
          ...item,
          index: BigInt(lastNftIndex + index + 1),
        }));

        await mintService.mintItems(
          chunksWithIndex,
          collectionAddress,
          metadata,
        );
      } catch (e) {
        if (e instanceof AxiosError) {
          console.log(e.message, e.status, e.response.data);
        } else {
          console.error(e);
        }
      }
    }
  }

  // log results
  console.log("chacheUsed", chacheUsed);
  console.log("nftItems", nftItems.length);
  console.log("cachedBlockChainItems", cachedBlockChainItems.size);
})();

async function checkNftTransfers(nftItem: NFTItem, { currentOwner }) {
  // get nft transfers
  const transfers = await OnTon.getItemTransfers(nftItem.address, {
    sort: "asc",
  });

  // if there were no transfers we just use the curent owner_address
  if (!transfers.nft_transfers.length) {
    console.log("no transfers", nftItem.address, nftItem.index);
    if (
      Address.parse(currentOwner).equals(Address.parse(nftItem.owner_address))
    ) {
      console.log("same_owner", currentOwner, nftItem);
      try {
        await prisma.nFTItem.update({
          where: {
            id: nftItem.id,
            owner_address: {
              not: currentOwner,
            },
          },
          data: {
            owner_address: currentOwner,
          },
        });
      } catch (e) {
        if (e instanceof PrismaClientKnownRequestError) {
          console.log(e.code, e.meta?.target, e.cause);
        } else {
          console.error(e);
        }
      }
      return true;
    }
  }

  // if there were transfers we check the first transer in the list (old_owner)
  if (transfers.nft_transfers.length) {
    const oldOwner = transfers.nft_transfers[0].old_owner;
    if (Address.parse(oldOwner).equals(Address.parse(nftItem.owner_address))) {
      console.log("same_owner", currentOwner, nftItem);
      try {
        await prisma.nFTItem.update({
          where: {
            id: nftItem.id,
            owner_address: {
              not: currentOwner,
            },
          },
          data: {
            owner_address: currentOwner,
          },
        });
      } catch (error) {
        if (error instanceof PrismaClientKnownRequestError) {
          console.log("prisma error", error.cause);
        } else {
          console.error("updateerror", error);
        }
      }
      return true;
    }
  }

  return false;
}

async function getNft(address: string, index: number) {
  let blockChainItem: NftItem;
  if (cachedBlockChainItems.has(address)) {
    console.log("cached item", address, index);
    chacheUsed++;
    blockChainItem = cachedBlockChainItems.get(address);
  }

  if (!blockChainItem) {
    blockChainItem = (await OnTon.getNftItem(address, index)).nft_items[0];
  }

  return blockChainItem;
}

async function processNFTItem(nftItem: NFTItem) {
  console.log("proccessing item", nftItem.address, nftItem.index);
  // get collection
  const collection = await prisma.nFTCollection.findUnique({
    where: {
      id: nftItem.collection_id,
    },
  });

  console.log(`collection ${nftItem.id}`, collection);

  if (!collection) {
    console.error("no collection");
    return;
  }

  const blockChainItem = await getNft(collection.address, nftItem.index);

  // if not found we make it failed
  if (!blockChainItem) {
    console.log("not found", nftItem.address, nftItem.index);
    await prisma.nFTItem.update({
      where: {
        id: nftItem.id,
      },
      data: {
        state: "failed",
        fail_reason: "not_found_on_blockchain",
      },
    });
    return;
  }

  const currentOwner = blockChainItem.owner_address;

  cachedBlockChainItems.set(nftItem.address, blockChainItem);

  const transferCheck = await checkNftTransfers(nftItem, {
    currentOwner,
  });

  if (transferCheck) {
    return;
  }

  return {
    mint_data: {
      address: Address.parse(nftItem.owner_address),
      attributes: {
        order_id: nftItem.order_id,
      },
      index: BigInt(0), // we set this when we group them by collection
      nft_id: nftItem.id,
      collection_address: collection.address,
    } as participantData,
    collection,
  };
}
