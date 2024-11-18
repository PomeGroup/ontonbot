import { Injectable } from "@nestjs/common";
import { Address, toNano } from "@ton/core";
import axios, { AxiosError } from "axios";
import { PrismaService } from "nestjs-prisma";
import { MinioClientService } from "src/minio/minio.service";
import { OnTon } from "src/OnTon";
import { MetadataParserZ } from "src/types/nft.types";
import { NftMintItemParams } from "./contracts/NftBatchMintMessage";
import { NftCollection } from "./contracts/NftCollection";
import { NftItemParams } from "./contracts/NftItemParams";
import {
  CollectionDTO,
  CollectionFiles,
  ItemDTO,
  ItemMetaData,
  participantData,
} from "./dto";
import { MetaDataService } from "./metadata.service";
import { callForSuccess, sleep } from "./utils/delay";

@Injectable()
export class NFTService {
  constructor(
    private readonly metadataService: MetaDataService,
    private readonly prisma: PrismaService,
    private readonly minio: MinioClientService,
  ) {}

  /**
   *
   * @param collectionDTO
   * @param files
   * @returns
   */
  async deployCollection(
    collectionDTO: CollectionDTO,
    files: CollectionFiles,
  ): Promise<Record<string, string>> {
    const { walletContract, wallet, secretKey } = await OnTon.getOnTonWallet();
    const {
      name,
      description,
      numerator,
      denominator,
      recipient,
      commonContentUrl,
    } = collectionDTO;
    const { collectionContent } =
      await this.metadataService.createCollectionMetadata({
        name,
        description,
        cover: files?.cover && Array.isArray(files?.cover) && files.cover[0],
        image: files?.image && Array.isArray(files?.image) && files.image[0],
      });

    const royalty = {
      numerator: BigInt(numerator),
      denominator: BigInt(denominator),
      recipient: Address.parse(recipient),
    };

    const collection = new NftCollection(
      {
        collectionContentUrl: collectionContent.url,
        commonContentUrl,
        ownerAddress: wallet.address,
        nextItemIndex: 0,
        royalty,
      },
      walletContract,
      OnTon.tonClient(),
      secretKey,
    );

    const { collectionAddress, seqno } = await callForSuccess(
      async () => await collection.deploy(),
    );
    await OnTon.waitSeqno(seqno, walletContract);

    const savedCollection = await this.prisma.nFTCollection.create({
      data: {
        address: Address.parse(collectionAddress).toString(),
        metadata_url: collectionContent.url,
      },
    });

    return {
      id: savedCollection.id,
      collectionAddress,
      metadata_url: savedCollection.metadata_url,
      image_url: collectionContent.image,
      cover_url: collectionContent.cover,
    };
  }

  async generateItemMetaData(
    collection_address: string,
    itemDTO: ItemDTO,
    file: Express.Multer.File,
  ) {
    const imageUrl = await this.minio.uploadFile(
      process.env.MINIO_ITEM_BUCKET,
      file.originalname,
      file.buffer,
      file.size,
      {
        mimetype: file.mimetype,
        collection_address: collection_address,
      },
    );
    const { name, description } = itemDTO;
    return this.prisma.nFTCollection.update({
      where: {
        address: Address.parse(collection_address).toString(),
      },
      data: {
        item_meta_data: {
          name,
          description,
          image: imageUrl,
        },
      },
    });
  }

  async mintItems(
    participantData: participantData[],
    collectionAddress: Address,
    metadata: ItemMetaData,
  ): Promise<Record<string, BigInt>> {
    const { walletContract, secretKey } = await OnTon.getOnTonWallet();

    const items: NftMintItemParams<NftItemParams>[] = [];

    for (const { address, attributes, index } of participantData) {
      console.log("mintinf for address " + address);
      console.log("metadata generating");
      const item_metadata_url = await this.metadataService.createItemMetadata({
        ...metadata,
        attributes,
      });

      console.log({ item_metadata_url });

      items.push({
        index,
        value: toNano("0.05"),
        owner: address,
        individualContent: item_metadata_url,
      });
    }

    const chunks = [];

    for (let i = 0; i < participantData.length; i += 100) {
      const chunk = items.slice(i, i + 100);

      chunks.push(chunk);
    }

    for (const chunk of chunks) {
      let isBatchDeployed = false;
      while (!isBatchDeployed) {
        try {
          const seqno = await NftCollection.deployItemsBatch(
            chunk,
            collectionAddress,
            walletContract,
            secretKey,
          );
          console.log("my sequence number ==========>", seqno);
          await OnTon.waitSeqno(seqno, walletContract);
          isBatchDeployed = true;
        } catch (e) {
          if (e instanceof AxiosError) {
            console.error(e.message, e.response.data);
          } else {
            console.error(e);
          }
          await sleep(2000);
        }
      }
    }

    return items.reduce((result, item) => {
      result[item.owner.toString()] = Number(item.index);
      return result;
    }, {});
  }

  async getItemsOfCollection(
    collection_address: string,
    skip: number = 0,
    take: number = 10,
  ) {
    return this.prisma.nFTItem.findMany({
      skip,
      take,
      where: {
        collection: {
          address: collection_address,
        },
      },
      orderBy: {
        create_at: "desc",
      },
    });
  }

  async getNftItem(collection_address: string, nft_owner_address: string) {
    return this.prisma.nFTItem.findMany({
      where: {
        AND: {
          owner_address: Address.parse(nft_owner_address).toString(),
          collection: {
            address: collection_address,
          },
        },
      },
    });
  }

  async finishMinting(collection_address: string) {
    return this.prisma.nFTCollection.update({
      where: {
        address: collection_address,
      },
      data: {
        in_process: false,
      },
    });
  }

  async revokeInValidNfts(
    start_index: number,
    end_index: number,
    collection_address: string,
  ) {
    const failed_items = [];
    const successfully_revoked = [];

    for (let i = start_index; start_index <= end_index; i++) {
      try {
        await this.revokeNftItem(i, collection_address);
        successfully_revoked.push(i);
        await sleep(1000);
      } catch (e) {
        console.error(`Error Occured while revoking item ${i}`, e);
        failed_items.push(i);
      }
    }

    return {
      failed_items,
      successfully_revoked,
    };
  }

  async revokeNftItem(index: number, collection_address: string) {
    // get the item
    const nftItem = await OnTon.getNftItem(collection_address, index);
    console.log(
      `!! nftItem will be revoked ${index} from collection : ${collection_address}`,
      nftItem,
    );

    // throw if no nft item found
    if (!nftItem.nft_items) {
      throw new Error(
        `Nft item not found with the following index ${index} from collection ${collection_address}`,
      );
    }

    // extract nft metadata url
    const metadata_url = nftItem.nft_items[0].content.uri;
    const metadata_raw = await axios.get(metadata_url);
    const metadata = MetadataParserZ.parse(metadata_raw);

    // update metadata url
    metadata.image = "https://storage.onton.live/onton/ticket_revoked.gif";
    metadata.name = "Revoked Ticket";
    metadata.description = "This nft has been revoked and is no longer valid";

    // put the item with the same id to minio to overwrite it with new data
    const metadata_file_name = metadata.image.replace(
      "https://storage.onton.live/onton/",
      "",
    );
    const metadata_buffer = Buffer.from(JSON.stringify(metadata));
    await this.minio.client.putObject(
      "onton",
      metadata_file_name,
      metadata_buffer,
    );

    return { updated_content: metadata_url };
  }
}
