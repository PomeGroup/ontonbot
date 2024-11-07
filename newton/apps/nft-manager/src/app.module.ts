import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MulterModule } from "@nestjs/platform-express";
import { ScheduleModule } from "@nestjs/schedule";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { MinioController } from "./minio/minio.controller";
import { MinioModule } from "./minio/mino.module";
import { NFTModule } from "./nft/nft.module";
import { PrismaCustomModule } from "./prisma/prisma.module";

@Module({
  imports: [
    ConfigModule.forRoot(),
    ScheduleModule.forRoot(),
    PrismaCustomModule,
    MulterModule,
    MinioModule,
    NFTModule,
  ],
  controllers: [AppController, MinioController],
  providers: [AppService],
})
export class AppModule {}
