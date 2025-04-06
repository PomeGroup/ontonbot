import { Bot, GrammyError } from "grammy";
import { Request, Response } from "express";
import { logger } from "../utils/logger";

export const createInviteLinkHandler = async (
  req: Request & { bot: Bot },
  res: Response,
): Promise<Response> => {
  const { chat_id, creates_join_request = false, name = "" } = req.body;

  if (!chat_id) {
    return res.status(400).json({ success: false, error: "Missing chat_id" });
  }


  // Build the invite link options
  const linkOptions: Parameters<typeof req.bot.api.createChatInviteLink>[1] = {
    creates_join_request: Boolean(creates_join_request),
    member_limit: 1,
  };
  if (name) linkOptions.name = name;

  // We'll do up to 10 attempts in a loop
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {

    try {
      const result = await req.bot.api.createChatInviteLink(chat_id, linkOptions);
      logger.log(`Invite link created for chat ${chat_id}: ${result.invite_link} (attempt=${attempt})`);
      // If successful, return the result
      return res.status(200).json({
        success: true,
        invite_link: result.invite_link,
        full_result: result,
      });
    } catch (error: any) {
      // Check if this is a 429 rate-limit error
      if (error instanceof GrammyError && error.error_code === 429) {
        // Wait if we haven't reached maxAttempts
        if (attempt < maxAttempts) {
          //const waitSec = (error.parameters?.retry_after || 1) + 1;
          const waitMsSec = 200;
          logger.warn(
            `429 error in createInviteLinkHandler, attempt=${attempt}. Sleeping ${waitMsSec}s, (attempt=${attempt})   then retrying...`,
          );
          await new Promise((resolve) => setTimeout(resolve, waitMsSec));
          // then continue to the next loop iteration
          continue;
        } else {
          // if we've reached the last attempt, return an error
          logger.error("Max retries reached (${attempt}). Returning 429 to client. (attempt=${attempt})  ");
          return res.status(429).json({
            success: false,
            error: "Rate limit reached multiple times. Please try again later.",
            retry_after: error.parameters?.retry_after || 1,
          });
        }
      }

      // If it's not a 429 error or if something else goes wrong, log and return 500
      logger.error("Error in createInviteLinkHandler:  (attempt=${attempt})  ", error);
      return res.status(500).json({
        success: false,
        error: "Failed to create invite link. Please try again later.",
      });
    }
  }

  // If we somehow break out of the loop (shouldn’t happen), return generic error
  return res.status(500).json({
    success: false,
    error: "Invite link creation process ended unexpectedly.",
  });
};
