import { logger } from "@/server/utils/logger";
import { TokenCampaignSpinType } from "@/db/schema/tokenCampaignUserSpins";
import { sendTelegramMessage } from "@/lib/tgBot";

/**
 * Called from the cron job to notify the user that they've received a spin reward.
 * For each spin type, we craft a different message.
 */
export async function notifyUserOfAffiliateReward(
  telegramUserId: number | string,
  spinType: TokenCampaignSpinType
): Promise<boolean> {
  try {
    let messageText: string;
    let rewardLink: string;
    let buttonText: string;
    if (spinType === "specific_reward") {
      // Golden reward message
      rewardLink = `https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME}/event?startapp=tab_campaign`;
      buttonText = "Check your Golden Reward";
      messageText = `
🎉 Congratulations! 🎉

You've just received a special Golden Reward spin for the ONION Genesis  Campaign! 
This unique spin grants you an instant golden collection Reward. Enjoy!
      `;
    } else {
      // Rewarded spin message
      rewardLink = `https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME}/event?startapp=tab_campaign`;
      buttonText = "Spin Now";
      messageText = `
🔥 Congrats on more ONION Genesis Campaign success! 🔥

You've earned an extra spin chance for the ONION Genesis  Campaign. Use it and 
keep growing your onion adventure!
      `;
    }

    // Replace with your real chat ID logic
    const chat_id = telegramUserId;

    const response = await attemptSendTelegramWithRetries(
      {
        telegramUserId: chat_id.toString(),
        rewardLink: rewardLink,
        buttonText: buttonText,
      },
      messageText
    );

    // Decide success/fail
    if (!response) {
      logger.warn(`notifyUserOfAffiliateReward: Failed to send reward notification to ${chat_id}`);
      return false;
    }
    logger.info(`notifyUserOfAffiliateReward: Successfully notified user ${chat_id} of spinType=${spinType}`);
    return true;
  } catch (error) {
    logger.error(`notifyUserOfAffiliateReward: error for user #${telegramUserId}:`, error);
    return false;
  }
}

/**
 * Example wrapper to demonstrate your existing retry function,
 * but adapted to allow a custom message text.
 */
async function attemptSendTelegramWithRetries(
  row: { telegramUserId: string; rewardLink: string; buttonText: string },
  customMessageText: string
): Promise<boolean> {
  // Example usage:
  let attempts = 0;
  while (attempts < 10) {
    attempts++;
    try {
      logger.info(`notifyUserOfAffiliateReward:  Sending spin reward to user ${row.telegramUserId}, attempt #${attempts}`);

      // Your actual Telegram sending logic here:
      // e.g., `sendTelegramMessage` with { chat_id, message: customMessageText, link: row.rewardLink, linkText: "Claim" }
      const response = await sendTelegramMessage({
        chat_id: row.telegramUserId,
        message: customMessageText,
        link: row.rewardLink,
        linkText: row.buttonText,
      });

      if (response.success) {
        logger.info(`notifyUserOfAffiliateReward: Notification success for user ${row.telegramUserId}`);
        return true;
      } else {
        logger.warn(
          `notifyUserOfAffiliateReward: Notification attempt #${attempts} failed for user ${row.telegramUserId}: ${response.error}`
        );
      }
    } catch (error) {
      logger.error(
        `notifyUserOfAffiliateReward: Notification attempt #${attempts} error for user ${row.telegramUserId} =>`,
        error
      );
    }

    // If we reached here, attempt failed => wait 300ms before next try
    if (attempts < 10) {
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }
  logger.error(`notifyUserOfAffiliateReward: All 10 attempts failed for user ${row.telegramUserId} => giving_up`);
  return false;
}
