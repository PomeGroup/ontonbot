import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from "@nestjs/common";
import {
  FileFieldsInterceptor,
  FileInterceptor,
} from "@nestjs/platform-express";
import { CollectionDTO, ItemDTO } from "./dto";
import { NFTService } from "./nft.service";
import { RevokeItemsBody } from "src/types/nft.types";

@Controller("nft")
export class NFTController {
  constructor(private readonly nftService: NFTService) { }
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: "cover", maxCount: 1 },
      { name: "image", maxCount: 1 },
    ]),
  )
  @Post("collection")
  async deployCollection(
    @Body() collectionDTO: CollectionDTO,
    @UploadedFiles()
    files: {
      cover?: Express.Multer.File[];
      image: Express.Multer.File[];
    },
  ) {
    return this.nftService.deployCollection(collectionDTO, files);
  }

  @UseInterceptors(FileInterceptor("image"))
  @Post("collection/:collectionAddress/item")
  async generateItemMetaData(
    @Param("collectionAddress") collectionAddress: string,
    @Body()
    itemDTO: ItemDTO,
    @UploadedFile() image: Express.Multer.File,
  ) {
    return this.nftService.generateItemMetaData(
      collectionAddress,
      itemDTO,
      image,
    );
  }

  @Get("collection/:collectionAddress/items")
  async getItemsOfCollection(
    @Param("collectionAddress") collection_address: string,
    @Query("skip") skip?: string,
    @Query("take") take?: string,
  ) {
    return this.nftService.getItemsOfCollection(
      collection_address,
      skip && Number(skip),
      take && Number(take),
    );
  }

  @Get("collection/:collectionAddress")
  async getNftItem(
    @Param("collectionAddress") collection_address: string,
    @Query("nft_owner_address") nft_owner_address: string,
  ) {
    return this.nftService.getNftItem(collection_address, nft_owner_address);
  }

  @Put("collection/:collectionAddress")
  async finishMinting(@Param("collectionAddress") collection_address: string) {
    return this.nftService.finishMinting(collection_address);
  }

  @Put("collection/:collectionAddress/revoke-items")
  async revokeNftItemsByIndex(
    @Param("collectionAddress") collection_address: string,
    @Body()
    revokeItemsParams: RevokeItemsBody
  ) {
    return await this.nftService.revokeInValidNfts(
      Number(revokeItemsParams.start_index),
      Number(revokeItemsParams.end_index),
      collection_address
    )
  }
}
