import { Bot, GrammyError } from "grammy";
import { Request, Response } from "express";
import { logger } from "../utils/logger";

/**
 * Revokes (deletes) a specific invite link for the given chat.
 *
 * @param req.body.chat_id The group's Telegram chat ID
 * @param req.body.invite_link The invite link to revoke
 */
export const deleteInviteLinkHandler = async (
  req: Request & { bot: Bot },
  res: Response,
): Promise<Response> => {
  try {
    const { chat_id, invite_link } = req.body;

    if (!chat_id || !invite_link) {
      return res.status(400).json({
        success: false,
        error: "Missing chat_id or invite_link",
      });
    }

    // This method revokes (invalidates) an existing invite link
    const revokedLinkInfo = await req.bot.api.revokeChatInviteLink(
      chat_id,
      invite_link,
    );

    return res.status(200).json({
      success: true,
      message: "Invite link revoked successfully",
      revoked_link_info: revokedLinkInfo,
    });
  } catch (error) {
    // Handle 429 rate-limit error with up to 10 retries
    if (error instanceof GrammyError && error.error_code === 429) {
      return res.status(429).json({
        success: false,
        error: "Rate limit reached. Try again later.",
        retry_after: error.parameters?.retry_after || 1,
      });
    }

    logger.error("Error in deleteInviteLinkHandler:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to revoke invite link. Please try again later.",
    });
  }
};
