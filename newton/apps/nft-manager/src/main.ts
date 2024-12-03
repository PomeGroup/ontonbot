import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  console.log("Onton Api Key", process.env.ONTON_API_KEY);
  console.log(
    "💣 PTMA base",
    `http://${process.env.IP_RANGE_BASE + ":" + process.env.MINI_APP_PORT}/api/v1`,
  );
  // app.useGlobalPipes(new ValidationPipe());
  await app.listen(process.env.NFT_MANAGER_PORT);
}
bootstrap();
