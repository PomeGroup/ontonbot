import { Bot, GrammyError } from "grammy";
import { Request, Response } from "express";
import { logger } from "../utils/logger";

/**
 * Creates a new invite link for the given chat.
 * @param req
 * @param res
 */

export const createInviteLinkHandler = async (
  req: Request & { bot: Bot },
  res: Response,
): Promise<Response> => {
  try {
    const {
      chat_id,
      user_id,
      creates_join_request = false,
      name = "",
    } = req.body;

    if (!chat_id) {
      return res.status(400).json({ success: false, error: "Missing chat_id" });
    }

    // For logging or DB use if needed
    logger.log(`User ${user_id} requested an invite link for chat ${chat_id}`);

    // Build the invite link options
    const linkOptions: Parameters<typeof req.bot.api.createChatInviteLink>[1] = {
      creates_join_request: Boolean(creates_join_request),
    };
    if (name) linkOptions.name = name;

    const result = await req.bot.api.createChatInviteLink(chat_id, linkOptions);

    return res.status(200).json({
      success: true,
      invite_link: result.invite_link,
      full_result: result,
    });
  } catch (error) {
    // Handle 429 rate-limit error with up to 10 retries
    if (error instanceof GrammyError && error.error_code === 429) {
      logger.warn("429 error in createInviteLinkHandler, retrying...");
      return res.status(429).json({
        success: false,
        error: "Rate limit reached. Try again later.",
        retry_after: error.parameters?.retry_after || 1,
      });
    }

    logger.error("Error in createInviteLinkHandler:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to create invite link. Please try again later.",
    });
  }
};
