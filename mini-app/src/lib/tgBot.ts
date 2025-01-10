import axios from "axios";
import { Bot } from "grammy";
import { configProtected } from "@/server/config";

const tgClient = axios.create({
  baseURL: `http://${process.env.IP_TELEGRAM_BOT}:${process.env.TELEGRAM_BOT_PORT}`,
});

import { AxiosError } from "axios";
import { removeKey, removeSecretKey } from "@/lib/utils";

export const sendTelegramMessage = async (props: { chat_id: string | number; message: string; link?: string }) => {
  try {
    const response = await tgClient.post(
      `http://${process.env.IP_TELEGRAM_BOT}:${process.env.TELEGRAM_BOT_PORT}/send-message`,
      {
        chat_id: props.chat_id,
        custom_message: props.message,
        link: props.link,
      }
    );

    // If the response indicates success, return the response data
    if (response.data.success) {
      return {
        success: true,
        message: response.data.message || "Message sent successfully",
      };
    }

    // If the server responded but with an error, handle the error
    const errorMessage = `Error sending message sendTelegramMessage:${response.data.error || "An unknown error occurred"}`;
    console.error(errorMessage);
    return {
      success: false,
      error: errorMessage,
      status: response.status || 500,
    };
  } catch (error: unknown) {
    // Type assertion to AxiosError
    if (error instanceof AxiosError && error.response && error.response.data) {
      // Handle errors returned from the server
      const errorMessage = `Error sending message sendTelegramMessage:${error.response.data.error || "Unknown error from server"}`;
      console.error(errorMessage);
      return {
        success: false,
        error: errorMessage,
        status: error.response.status || 500,
      };
    }

    // For other types of errors, such as network errors
    const errorMessage = `Error sending message sendTelegramMessage:${(error as Error).message || "An unexpected error occurred"}`;
    console.error(errorMessage);
    return {
      success: false,
      error: errorMessage,
      status: 500,
    };
  }
};
export const sendEventPhoto = async (props: { event_id: string; user_id: string | number; message: string }) => {
  try {
    const response = await tgClient.post(
      `http://${process.env.IP_TELEGRAM_BOT}:${process.env.TELEGRAM_BOT_PORT}/send-photo`,
      {
        id: props.event_id,
        user_id: String(props.user_id),
        message: props.message,
      }
    );

    // If the response indicates success, return the response data
    if (response.data.success) {
      return {
        success: true,
        message: response.data.message || "Message sent successfully",
      };
    }

    // If the server responded but with an error, handle the error
    const errorMessage = `Error sending message sendTelegramMessage:${response.data.error || "An unknown error occurred"}`;
    console.error(errorMessage);
    return {
      success: false,
      error: errorMessage,
      status: response.status || 500,
    };
  } catch (error: unknown) {
    // Type assertion to AxiosError
    if (error instanceof AxiosError && error.response && error.response.data) {
      // Handle errors returned from the server
      const errorMessage = `Error sending message sendTelegramMessage:${error.response.data.error || "Unknown error from server"}`;
      console.error(errorMessage);
      return {
        success: false,
        error: errorMessage,
        status: error.response.status || 500,
      };
    }

    // For other types of errors, such as network errors
    const errorMessage = `Error sending message sendTelegramMessage:${(error as Error).message || "An unexpected error occurred"}`;
    console.error(errorMessage);
    return {
      success: false,
      error: errorMessage,
      status: 500,
    };
  }
};

// 🌳 ---- SEND LOG NOTIFICATION ---- 🌳
export const sendLogNotification = async (props: { message: string; topic: "event" | "ticket" | "system" }) => {
  if (!configProtected?.bot_token_logs || !configProtected?.logs_group_id) {
    console.error("Bot token or logs group ID not found in configProtected for this environment");
    throw new Error("Bot token or logs group ID not found in configProtected for this environment");
  }

  const { bot_token_logs: BOT_TOKEN_LOGS, logs_group_id: LOGS_GROUP_ID } = configProtected;
  const { events_topic: EVENTS_TOPIC, system_topic: SYSTEM_TOPIC, tickets_topic: TICKETS_TOPIC } = configProtected;

  const logBot = new Bot(BOT_TOKEN_LOGS);

  return await logBot.api.sendMessage(Number(LOGS_GROUP_ID), props.message, {
    reply_parameters: {
      message_id: Number(props.topic === "ticket" ? TICKETS_TOPIC : props.topic === "event" ? EVENTS_TOPIC : SYSTEM_TOPIC),
    },
    parse_mode: "HTML",
    link_preview_options: { is_disabled: true },
  });
};

/// 🌳 ---- render the update event message ---- 🌳
export const renderUpdateEventMessage = (
  username: string | number,
  eventUuid: string,
  oldChanges: any,
  updateChanges: any
): string => {
  return `
@${username} <b>Updated</b> an event <code>${eventUuid}</code> successfully

Before:
<pre><code>${removeSecretKey(oldChanges)}</code></pre>

After:
<pre><code>${removeSecretKey(updateChanges)}</code></pre>

Open Event: https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME}/event?startapp=${eventUuid}
`;
};

/// 🌳 ---- render the add event message ---- 🌳
export const renderAddEventMessage = (username: string | number, eventUuid: string, eventData: any): string => {
  const eventDataWithoutDescription = removeKey(eventData, "description");
  return `
@${username} <b>Added</b> a new event <code>${eventUuid}</code> successfully

<pre><code>${removeSecretKey(eventDataWithoutDescription)}</code></pre>

Open Event: https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME}/event?startapp=${eventUuid}
  `;
};
