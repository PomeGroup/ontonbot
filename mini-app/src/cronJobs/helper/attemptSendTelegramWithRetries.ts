import { sendTelegramMessage } from "@/lib/tgBot";
import { logger } from "@/server/utils/logger";

/**
 * Example wrapper to demonstrate your existing retry function,
 * but adapted to allow a custom message text.
 */
export async function attemptSendTelegramWithRetries(
  row: { telegramUserId: string; rewardLink: string; buttonText: string },
  customMessageText: string
): Promise<boolean> {
  // Example usage:
  let attempts = 0;
  while (attempts < 10) {
    attempts++;
    try {
      logger.info(
        `attemptSendTelegramWithRetries:  Sending spin reward to user ${row.telegramUserId},${customMessageText} ||  attempt #${attempts}`
      );

      // Your actual Telegram sending logic here:
      // e.g., `sendTelegramMessage` with { chat_id, message: customMessageText, link: row.rewardLink, linkText: "Claim" }
      const response = await sendTelegramMessage({
        chat_id: row.telegramUserId,
        message: customMessageText,
        link: row.rewardLink,
        linkText: row.buttonText,
      });

      if (response.success) {
        logger.info(
          `attemptSendTelegramWithRetries: Notification success for user ${customMessageText} ||  ${row.telegramUserId}`
        );
        return true;
      } else {
        logger.warn(
          `attemptSendTelegramWithRetries: Notification attempt #${attempts} failed for user ${row.telegramUserId}: ${customMessageText} ||  ${response.error}`
        );
      }
    } catch (error) {
      logger.error(
        `attemptSendTelegramWithRetries: Notification attempt #${attempts} error for user ${row.telegramUserId}  ${customMessageText} || =>`,
        error
      );
    }

    // If we reached here, attempt failed => wait 300ms before next try
    if (attempts < 10) {
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }
  logger.error(
    `attemptSendTelegramWithRetries: All 10 attempts failed for user ${row.telegramUserId} ${customMessageText} ||  => giving_up`
  );
  return false;
}
