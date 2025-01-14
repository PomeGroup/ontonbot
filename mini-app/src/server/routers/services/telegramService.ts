import { sendTelegramMessage , sendEventPhoto } from "@/lib/tgBot";
import { EventTypeSecure, RewardType, VisitorsType } from "@/types/event.types";
import { rewardLinkZod } from "@/types/user.types";
import axios from "axios";
import { logger } from "@/server/utils/logger";
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
    logger.error("Error sending reward notification:", error);

    // Return structured error response instead of throwing
    return {
      success: false,
      error: (error as Error).message || "An unexpected error occurred",
    };
  }
};

// Send OTP Code via Telegram
export const sendCode = async (telegramUserId: number, code: string) => {
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
    logger.error("Error sending OTP code:", error);

    // Return structured error response instead of throwing
    return {
      success: false,
      error: (error as Error).message || "An unexpected error occurred",
    };
  }
};
// Send a simple Telegram message without a link
export const sendTelegramMessageNoLink = async (chat_id: string | number, message: string) => {
  try {
    const response = await sendTelegramMessage({
      chat_id,
      message,
    });

    if (!response.success) {
      logger.error("Failed to send message:", response.error);
      return {
        success: false,
        error: response.error || "Failed to send message",
      };
    }
    return {
      success: true,
      message: "Message sent successfully",
    };
  } catch (error) {
    logger.error("Error sending Telegram message:", error);
    return {
      success: false,
      error: (error as Error).message || "An unexpected error occurred",
    };
  }
};

export const shareEventRequest = async (
  user_id: string,
  event_uuid: string
): Promise<{ success: boolean; data?: any; error?: string }> => {
  const share_link = `https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME}/event?startapp=${event_uuid}`;
  const event_url = `${process.env.NEXT_PUBLIC_APP_BASE_URL}/events/${event_uuid}`;

  try {
    const response = await axios.post(
      `http://${process.env.IP_TELEGRAM_BOT}:${process.env.TELEGRAM_BOT_PORT}/share-event`,
      {
        user_id: user_id,
        id: event_uuid,
        share_link: share_link,
        url: event_url,
        custom_button: {
          text: "Open the Event",
          web_app: {
            url: event_url, // Ensure web_app is an object
          },
        },
      }
    );

    // Return success response
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    logger.error("Error sharing event: ", error);

    // Return error response with appropriate message
    return {
      success: false,
      error: (error as Error).message || "An unexpected error occurred",
    };
  }
};

export const shareOrganizerRequest = async (
  // The user (who wants to share the organizer)
  requestingUserId: string,
  // The organizer we want to share
  organizerId: string,
  // The relevant organizer fields
  organizerData: {
    org_channel_name: string | null;
    org_support_telegram_user_name: string | null;
    org_x_link: string | null;
    org_bio: string | null;
    org_image: string | null;
  },
): Promise<{ success: boolean; data?: any; error?: string }> => {
  // Construct your share link / URLs or any data you want
  const share_link = `https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME}/event?startapp=channels_${organizerId}`;
  const url = `${process.env.NEXT_PUBLIC_APP_BASE_URL}/channels/${organizerId}`;

  try {
    // Send a POST to the new /share-organizer route in your telegram-bot service
    const response = await axios.post(
      `http://${process.env.IP_TELEGRAM_BOT}:${process.env.TELEGRAM_BOT_PORT}/share-organizer`,
      {
        requesting_user: requestingUserId,
        organizer_id: organizerId,
        share_link,
        url,
        // Pass the extra organizer data so the bot can render them
        organizer_data: organizerData,
      }
    );

    return { success: true, data: response.data };
  } catch (error) {
    logger.error("Error sharing organizer: ", error);
    return {
      success: false,
      error: (error as Error).message || "An unexpected error occurred",
    };
  }
};
/****** export telegramService ******/

const tgService = {
  sendRewardNotification, // send reward notification to visitors
  sendCode, // send OTP code
  sendTelegramMessageNoLink, // send Telegram message without link
  shareEventRequest, // share event request
  sendTelegramMessage,
  sendEventPhoto,
  shareOrganizerRequest,
};

export default tgService;
