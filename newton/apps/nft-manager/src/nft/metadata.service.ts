import { Injectable } from "@nestjs/common";
import { MinioClientService } from "src/minio/minio.service";
import { CollectionMetadata, ItemMetaData } from "./dto";
import { randomString } from "src/helper";

@Injectable()
export class MetaDataService {
  private readonly CollectionBucket = process.env.MINIO_COLLECTION_BUCKET;
  private readonly ItemBucket = process.env.MINIO_ITEM_BUCKET;

  constructor(private readonly minio: MinioClientService) {}

  async createCollectionMetadata(collectionMetaData: CollectionMetadata) {
    const { name, description, cover, image } = collectionMetaData;

    const collectionImageURL = await this.minio.uploadFile(
      this.CollectionBucket,
      image.originalname,
      image.buffer,
      image.size,
    );

    const collectionCoverImageURL = await this.minio.uploadFile(
      this.CollectionBucket,
      cover.originalname,
      cover.buffer,
      cover.size,
    );

    const metadata = {
      name,
      description,
      cover_image: collectionCoverImageURL,
      image: collectionImageURL,
    };
    const metadataContent = Buffer.from(JSON.stringify(metadata));
    const fileURL = await this.minio.uploadFile(
      this.CollectionBucket,
      "metadata.json",
      metadataContent,
    );
    return {
      collectionContent: {
        url: fileURL,
        data: metadata,
        image: collectionImageURL,
        cover: collectionCoverImageURL,
      },
    };
  }

  async createItemMetadata(itemMetaData: ItemMetaData) {
    const { name, description, image_url, attributes } = itemMetaData;

    const metadata = {
      name,
      description,
      image: image_url,
      attributes,
    };

    const metadataContent = Buffer.from(JSON.stringify(metadata));

    const fileURL = await this.minio.uploadFile(
      this.ItemBucket,
      "metadata.json",
      metadataContent,
    );

    return fileURL;
  }
}
