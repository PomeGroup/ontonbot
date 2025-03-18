import { MyContext } from "../../types/MyContext";
import axios, { AxiosError } from "axios";
import { logger } from "../../utils/logger";

export function handleCreateError(ctx: MyContext, error: unknown) {
  if (axios.isAxiosError(error)) {
    const axErr = error as AxiosError;
    const data = axErr.response?.data as any;
    const msg = data?.message;
    logger.error("Error calling create =>", msg || axErr.message);
    ctx.reply(`Failed to create tournament. Error: ${msg || axErr.message}`);
  } else {
    ctx.reply("Failed to create tournament. Please try again later.");
  }
}