import { Bot, GrammyError } from "grammy";
import { logger } from "../utils/logger";
import { updateUserProfile } from "../db/db";
import { Request, Response } from "express";

export async function handleCheckBlockStatus(
  req: Request & { bot: Bot },
  res: Response,
) {
  const { user_id } = req.body;

  // 1) Validate input
  if (!user_id) {
    return res.status(400).json({ message: "Missing 'user_id' in request body" });
  }

  let hasBlockedTheBot = false;

  try {
    // 2) Attempt a minimal Telegram call (typing indicator)
    await req.bot.api.sendChatAction(user_id, "typing");
  } catch (error) {
    if (error instanceof GrammyError) {
      // 2.a) Handle Rate-Limiting (429)
      if (error.error_code === 429) {
        logger.error("Telegram rate limit reached:", error);
        // Telegram might provide a 'retry_after' value in error.parameters
        const retryAfter = error.parameters?.retry_after || 1;
        return res.status(429).json({
          message: "Rate limit reached. Try again later.",
          retry_after: retryAfter,
        });
      }

      // 2.b) Handle Bot-Blocked (403)
      if (
        error.error_code === 403 &&
        /bot was blocked by the user/i.test(error.description)
      ) {
        hasBlockedTheBot = true;
        logger.log(`User ${user_id} has blocked the bot.`);
      } else {
        // Some other 403 or 4xx error
        logger.error("Telegram 4xx error:", error);
        return res.status(error.error_code).json({
          message: "Telegram error: " + (error.description || "Unknown"),
        });
      }
    } else {
      // Unexpected error or non-Grammy error
      logger.error("Unknown error checking block status:", error);
      return res
        .status(500)
        .json({ message: "Internal Server Error (block check failed)" });
    }
  }

  // 3) Update DB to reflect has_blocked_the_bot
  try {
    await updateUserProfile(Number(user_id), { hasBlockedBot: hasBlockedTheBot });
  } catch (dbError) {
    logger.error("Database update error:", dbError);
    return res
      .status(500)
      .json({ message: "Internal Server Error (DB update failed)" });
  }

  // 4) Respond with the final status
  return res.json({
    user_id,
    has_blocked_the_bot: hasBlockedTheBot,
  });
}