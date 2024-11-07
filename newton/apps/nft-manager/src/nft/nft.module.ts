import { Module } from "@nestjs/common";
import { NFTService } from "./nft.service";
import { NFTController } from "./nft.controller";
import { MetaDataService } from "./metadata.service";

@Module({
  controllers: [NFTController],
  providers: [NFTService, MetaDataService],
  exports: [NFTService],
})
export class NFTModule {}
