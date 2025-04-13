import { logger } from "@/server/utils/logger";
import { TokenCampaignSpinType } from "@/db/schema/tokenCampaignUserSpins";
import { attemptSendTelegramWithRetries } from "@/cronJobs/helper/attemptSendTelegramWithRetries";

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
