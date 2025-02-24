import axios from "axios";
import { Bot, InputFile } from "grammy";
import { configProtected } from "@/server/config";

const tgClient = axios.create({
  baseURL: `http://${process.env.IP_TELEGRAM_BOT}:${process.env.TELEGRAM_BOT_PORT}`,
});

import { AxiosError } from "axios";
import { removeKey, removeSecretKey } from "@/lib/utils";
import { EventRow } from "@/db/schema/events";
import { logger } from "@/server/utils/logger";
import { InlineKeyboardMarkup } from "grammy/types";
import { parseRejectReason, tgBotApprovedMenu, tgBotModerationMenu } from "@/moderationBot/menu";
import moderationLogDB from "@/server/db/moderationLogger.db";
import { getNoticeEmoji } from "@/moderationBot/helpers";

// Helper to post to your custom Telegram server
const tgClientPost = (path: string, data: any) =>
  tgClient.post(`http://${process.env.IP_TELEGRAM_BOT}:${process.env.TELEGRAM_BOT_PORT}/${path}`, data);

// =========== Send Telegram Message ===========
export const sendTelegramMessage = async (props: { chat_id: string | number; message: string; link?: string }) => {
  try {
    const response = await tgClientPost("send-message", {
      chat_id: props.chat_id,
      custom_message: props.message,
      link: props.link,
    });

    if (response.data.success) {
      return {
        success: true,
        message: response.data.message || "Message sent successfully",
      };
    }

    const errorMessage = `Error sending message sendTelegramMessage:${response.data.error || "An unknown error occurred"}`;
    logger.error(errorMessage);
    return {
      success: false,
      error: errorMessage,
      status: response.status || 500,
    };
  } catch (error: unknown) {
    if (error instanceof AxiosError && error.response && error.response.data) {
      const errorMessage = `Error sending message sendTelegramMessage:${
        error.response.data.error || "Unknown error from server"
      }`;
      logger.error(errorMessage);
      return {
        success: false,
        error: errorMessage,
        status: error.response?.status || 500,
      };
    }

    const errorMessage = `Error sending message sendTelegramMessage:${
      (error as Error).message || "An unexpected error occurred"
    }`;
    logger.error(errorMessage);
    return {
      success: false,
      error: errorMessage,
      status: 500,
    };
  }
};

// =========== Send Event Photo ===========
export const sendEventPhoto = async (props: { event_id: string; user_id: string | number; message: string }) => {
  try {
    const response = await tgClientPost("send-photo", {
      id: props.event_id,
      user_id: String(props.user_id),
      message: props.message,
    });

    if (response.data.success) {
      return {
        success: true,
        message: response.data.message || "Message sent successfully",
      };
    }

    const errorMessage = `Error sending message sendTelegramMessage:${response.data.error || "An unknown error occurred"}`;
    logger.error(errorMessage);
    return {
      success: false,
      error: errorMessage,
      status: response.status || 500,
    };
  } catch (error: unknown) {
    if (error instanceof AxiosError && error.response && error.response.data) {
      const errorMessage = `Error sending message sendTelegramMessage:${
        error.response.data.error || "Unknown error from server"
      }`;
      logger.error(errorMessage);
      return {
        success: false,
        error: errorMessage,
        status: error.response?.status || 500,
      };
    }

    const errorMessage = `Error sending message sendTelegramMessage:${
      (error as Error).message || "An unexpected error occurred"
    }`;
    logger.error(errorMessage);
    return {
      success: false,
      error: errorMessage,
      status: 500,
    };
  }
};

// 🌳 ---- SEND LOG NOTIFICATION ---- 🌳
export const sendLogNotification = async (
  props: {
    message: string;
    topic: "event" | "ticket" | "system" | "payments" | "no_topic";
    image?: string | null;
    inline_keyboard?: InlineKeyboardMarkup; // optional
    group_id?: number | string | null;
  } = {
    message: "",
    topic: "event",
    image: undefined,
    inline_keyboard: undefined,
    group_id: undefined,
  }
) => {
  if (!configProtected?.bot_token_logs || !configProtected?.logs_group_id) {
    logger.error("Bot token or logs group ID not found in configProtected for this environment");
    throw new Error("Bot token or logs group ID not found in configProtected for this environment");
  }
  let { bot_token_logs: BOT_TOKEN_LOGS, logs_group_id: LOGS_GROUP_ID } = configProtected;

  if (props.group_id) {
    LOGS_GROUP_ID = props.group_id.toString();
  }

  const topicMapping: Record<"no_topic" | "event" | "ticket" | "system" | "payments", string | null> = {
    event: configProtected.events_topic,
    ticket: configProtected.tickets_topic,
    system: configProtected.system_topic,
    payments: configProtected.payments_topic,
    no_topic: "no_topic",
  };

  const topicMessageId = topicMapping[props.topic];
  if (!topicMessageId) {
    logger.error(`Invalid or unconfigured topic: ${props.topic}`);
    throw new Error(`Invalid or unconfigured topic: ${props.topic}`);
  }

  const logBot = new Bot(BOT_TOKEN_LOGS);

  if (props.image) {
    const response = await axios.get(props.image, { responseType: "arraybuffer" });
    const buffer = response.data;
    logger.log("Sending telegram photo message", Number(LOGS_GROUP_ID), props.image, {
      caption: props.message,
      reply_parameters:
        topicMessageId === "no_topic"
          ? undefined
          : {
              message_id: Number(topicMessageId),
            },
      reply_markup: props.inline_keyboard,
      parse_mode: "HTML",
    });

    return await logBot.api.sendPhoto(Number(LOGS_GROUP_ID), new InputFile(buffer), {
      caption: props.message,
      reply_parameters:
        topicMessageId === "no_topic"
          ? undefined
          : {
              message_id: Number(topicMessageId),
            },
      reply_markup: props.inline_keyboard,
      parse_mode: "HTML",
    });
  } else {
    // Plain text
    return await logBot.api.sendMessage(Number(LOGS_GROUP_ID), props.message, {
      reply_parameters:
        topicMessageId === "no_topic"
          ? undefined
          : {
              message_id: Number(topicMessageId),
            },
      reply_markup: props.inline_keyboard,
      parse_mode: "HTML",
      link_preview_options: { is_disabled: true },
    });
  }
};
// CSV log sender
export type CsvLogProps = {
  message: string;
  topic: "event" | "ticket" | "system" | "payments" | "no_topic";
  csvFileName: string;
  csvContent: string;
  inline_keyboard?: InlineKeyboardMarkup;
  group_id?: number | string | null;
};

export async function sendLogNotificationWithCsv(props: CsvLogProps) {
  if (!configProtected?.bot_token_logs || !configProtected?.logs_group_id) {
    logger.error("Bot token or logs group ID not found in configProtected for this environment");
    throw new Error("Bot token or logs group ID not found in configProtected for this environment");
  }

  let { bot_token_logs: BOT_TOKEN_LOGS, logs_group_id: LOGS_GROUP_ID } = configProtected;

  // If a different group/chat ID is specified
  if (props.group_id) {
    LOGS_GROUP_ID = props.group_id.toString();
  }

  const topicMapping: Record<"no_topic" | "event" | "ticket" | "system" | "payments", string | null> = {
    event: configProtected.events_topic,
    ticket: configProtected.tickets_topic,
    system: configProtected.system_topic,
    payments: configProtected.payments_topic,
    no_topic: "no_topic",
  };

  const topicMessageId = topicMapping[props.topic];
  if (!topicMessageId) {
    logger.error(`Invalid or unconfigured topic: ${props.topic}`);
    throw new Error(`Invalid or unconfigured topic: ${props.topic}`);
  }

  const logBot = new Bot(BOT_TOKEN_LOGS);

  // Create a buffer for the CSV file
  const csvBuffer = Buffer.from(props.csvContent, "utf-8");

  logger.log("Sending telegram message with CSV attachment to", LOGS_GROUP_ID, {
    caption: props.message,
    reply_parameters:
      topicMessageId === "no_topic"
        ? undefined
        : {
            message_id: Number(topicMessageId),
          },
  });

  // Use sendDocument to attach the CSV
  return await logBot.api.sendDocument(Number(LOGS_GROUP_ID), new InputFile(csvBuffer, props.csvFileName), {
    caption: props.message,
    reply_parameters: topicMessageId === "no_topic" ? undefined : { message_id: Number(topicMessageId) },
    reply_markup: props.inline_keyboard,
    parse_mode: "HTML",
  });
}

// =========== RENDER FUNCTIONS ===========

export const renderUpdateEventMessage = (
  username: string | number,
  eventUuid: string,
  event_title: string,
  oldChanges: any,
  updateChanges: any
): string => {
  return `
@${username} <b>Updated</b> event <code>${event_title}</code> successfully
🔗Event Link: https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME}/event?startapp=${eventUuid}
`;
};

export const renderAddEventMessage = (username: string | number, eventData: EventRow): string => {
  const eventUuid = eventData.event_uuid;
  const eventDataWithoutDescription = removeSecretKey(removeKey(eventData, "description"));
  return `
@${username} <b>Added</b> a new event <code>${eventUuid}</code> successfully

<pre><code>${eventDataWithoutDescription}</code></pre>

Open Event: https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME}/event?startapp=${eventUuid}
`;
};

export async function renderModerationEventMessage(username: string | number, eventData: EventRow): Promise<string> {
  const eventUuid = eventData.event_uuid;

  // 1) Count how many notices the event owner has
  const totalNotices = await moderationLogDB.getNoticeCountForOwner(eventData.owner);

  // 2) Compute circle color
  const circleEmoji = getNoticeEmoji(totalNotices);

  // 3) Prepare event data display (excluding the `description`)
  const eventDataWithoutDescription = removeSecretKey(removeKey(eventData, "description"));

  // 4) Return message with a notice count line
  return `
<b>${eventData.title}</b> ${circleEmoji}

${eventData.subtitle}

${circleEmoji} User currently has <b>${totalNotices}</b> notice(s).

@${username}

Open Event: https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME}/event?startapp=${eventUuid}
`;
}
