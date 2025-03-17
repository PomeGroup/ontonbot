/* -------------------------------------------------------------------------- */
/*                       Helper: Send Message With Retry                      */

/* -------------------------------------------------------------------------- */

import { MyContext } from "../types/MyContext";
import { GrammyError } from "grammy";
import { sleep } from "../utils/utils";
import { logger } from "../utils/logger";

export async function sendMessageWithInfinityRetry(user_id: number | string, msg: string, ctx: MyContext) {
  try {
    await ctx.api.sendMessage(user_id, msg);
  } catch (error) {
    if (error instanceof GrammyError) {
      // Rate-limiting or blocked etc.
      if (error.error_code === 429) {
        // Wait and try again
        await sleep(100);
        return sendMessageWithInfinityRetry(user_id, msg, ctx);
      }
      // If user blocked the bot or something, we can ignore or log
      logger.error(`Failed to send broadcast to ${user_id}: ${error.description}`);
    }
  }
}