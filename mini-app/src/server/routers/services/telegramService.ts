import { EventTypeSecure, RewardType, VisitorsType } from "@/types/event.types";
import { sendTelegramMessage } from "@/lib/tgBot";
import { rewardLinkZod } from "@/types/user.types";

// Send reward notification to visitors
export const sendRewardNotification = async (
  reward: RewardType,
  visitor: VisitorsType,
  event: EventTypeSecure
) => {
  try {
    // Validate reward link and send Telegram message
    const rewardLink = rewardLinkZod.parse(reward.data).reward_link;

    // Send the message and return success if no error occurs
    const response = await sendTelegramMessage({
      link: rewardLink,
      chat_id: visitor.user_id as number,
      message: `Hey there, you just received your reward for the ${event.title} event. Please click on the link below to claim it.`,
    });

    // If the response was not successful, return the error
    if (!response.success) {
      return {
        success: false,
        error: response.error || "Failed to send reward notification",
      };
    }

    // Return success response
    return {
      success: true,
      message: "Notification sent successfully",
    };
  } catch (error) {
    // Handle the error and log it
    console.error("Error sending reward notification:", error);

    // Return structured error response instead of throwing
    return {
      success: false,
      error: (error as Error).message || "An unexpected error occurred",
    };
  }
};

// Send OTP Code via Telegram
export const sendCode = async (telegramUserId: number , code: string) => {
  try {
    // Send the OTP code as a Telegram message
    const response = await sendTelegramMessage({
      chat_id: telegramUserId,
      message: `Your OTP code is: ${code}. Please use this code to continue.`,
    });

    // If the response was not successful, return the error
    if (!response.success) {
      return {
        success: false,
        error: response.error || "Failed to send OTP code",
      };
    }

    // Return success response
    return {
      success: true,
      message: "OTP code sent successfully",
    };
  } catch (error) {
    // Handle the error and log it
    console.error("Error sending OTP code:", error);

    // Return structured error response instead of throwing
    return {
      success: false,
      error: (error as Error).message || "An unexpected error occurred",
    };
  }
};

/****** export telegramService ******/

const tgService = {
  sendRewardNotification,
  sendCode, // Added the new sendCode function here
};

export default tgService;
