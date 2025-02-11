import { logger } from "@/server/utils/logger";
import { startBot } from "@/lib/tgBot";

startBot().then(() => logger.log("startBot Function Finish ;"));
