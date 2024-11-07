import { Global, Logger, Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { loggingMiddleware, PrismaModule } from "nestjs-prisma";

@Global()
@Module({
  imports: [
    PrismaModule.forRoot({
      isGlobal: true,
      prismaServiceOptions: {
        middlewares: [
          // configure your prisma middleware
          loggingMiddleware({
            logger: new Logger("PrismaMiddleware"),
            logLevel: "log",
          }),
        ],
      },
    }),
  ],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaCustomModule {}
