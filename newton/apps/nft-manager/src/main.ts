import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  console.log("Onton Api Key", process.env.ONTON_API_KEY)
  console.log("PTMA base", process.env.PTMA_API_BASE_URL)
  // app.useGlobalPipes(new ValidationPipe());
  await app.listen(7863);
}
bootstrap();
