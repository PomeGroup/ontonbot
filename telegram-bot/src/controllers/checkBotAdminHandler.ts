import { Bot, GrammyError } from "grammy";
import { Request, Response } from "express";
import { logger } from "../utils/logger";

/**
 * Checks if the bot is an admin in a given chat.
 * @param req
 * @param res
 */
export const checkBotAdminHandler = async (
  req: Request & { bot: Bot },
  res: Response,
): Promise<Response> => {
  try {
    const { chat_id } = req.body;
    if (!chat_id) {
      return res.status(400).json({ success: false, error: "Missing chat_id" });
    }

    // Ensure the bot has loaded its info
    if (!req.bot.botInfo) {
      await req.bot.init();
    }
    const botId = req.bot.botInfo.id;

    // 1) Get info about the bot’s membership in the chat
    const chatMember = await req.bot.api.getChatMember(chat_id, botId);

    // 2) Check if status is administrator or creator
    const isAdmin =
      chatMember.status === "administrator" || chatMember.status === "creator";

    // 3) Optionally, retrieve more details about the chat
    const chatInfo = await req.bot.api.getChat(chat_id);

    return res.status(200).json({
      success: isAdmin,
      chatInfo: {
        id: chatInfo.id,
        type: chatInfo.type,
        title: chatInfo.title,
        // ... You can add more fields from chatInfo if needed
      },
    });
  } catch (error) {
    // Handle 429 rate-limit error with up to 10 retries
    if (error instanceof GrammyError && error.error_code === 429) {
      logger.warn("429 error in checkBotAdminHandler, retrying...");
      return res.status(429).json({
        success: false,
        error: "Rate limit reached. Try again later.",
        retry_after: error.parameters?.retry_after || 1,
      });
    }

    logger.error("Error in checkBotAdminHandler:", error);

    // If we exhausted retries or hit a different error, return an error response
    return res.status(500).json({
      success: false,
      error: "Failed to check bot admin status. Please try again later.",
    });
  }
};
