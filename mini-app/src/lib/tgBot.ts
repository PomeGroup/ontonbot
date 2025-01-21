import axios from "axios";
import { Bot, BotError, GrammyError } from "grammy";
import { configProtected } from "@/server/config";

const tgClient = axios.create({
  baseURL: `http://${process.env.IP_TELEGRAM_BOT}:${process.env.TELEGRAM_BOT_PORT}`,
});

import { AxiosError } from "axios";
import { removeKey, removeSecretKey } from "@/lib/utils";
import { EventRow } from "@/db/schema/events";
import { logger } from "@/server/utils/logger";
import { sleep } from "@/utils";
import { InlineKeyboardMarkup } from "grammy/types";

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

async function startBot() {
  while (true) {
    if (!configProtected?.bot_token_logs || !configProtected?.logs_group_id) {
      console.error("Bot token or logs group ID not found in configProtected for this environment");
      console.error("Retrying to start moderation log bot in 5 seconds...", configProtected);
      await sleep(5000); // Sleep for 5 seconds and try again
      continue;
    }

    const { bot_token_logs: BOT_TOKEN_LOGS, logs_group_id: LOGS_GROUP_ID } = configProtected;

    try {
      const bot = new Bot(BOT_TOKEN_LOGS);

      /* ------------------------------- On Message ------------------------------- */
      // bot.on("message", (ctx) => ctx.reply("Got another message! : " + ctx.message.text?.toString()));

      /* ------------------------------- On CallBack ------------------------------ */
      bot.on("callback_query:data", async (ctx) => {
        const payload = ctx.callbackQuery.data;
        console.log("callback_query with payload", payload);

        const [status, event_uuid] = payload.split("_");

        // console.log();

        // logger.log("CTX" , ctx);
        
        console.log("CTX_MESSAGE" , ctx);

        const orignal_text = ctx.update?.message?.caption || "";
        const new_text = orignal_text + "\nStatus : " + status;

        ctx.editMessageCaption({
          caption : new_text
        });

        await ctx.answerCallbackQuery({ text: "Got it !!" }); // remove loading animation
      });
      /* ------------------------------ Start The Bot ----------------------------- */
      await bot.start({
        onStart: () => console.log("Started The Moderation/Logger Bot Successfully Callback"),
      });

      console.log("Started The Moderation/Logger Bot Successfully");
      break; // Exit the loop once the bot starts successfully
    } catch (error) {
      if (error instanceof GrammyError) {
        if (error.error_code === 409) {
          return;
        }
      }
      console.error("Error while starting the bot. Retrying in 5 seconds...", error);
      await sleep(5000);
    }
  }
}

// 🌳 ---- SEND LOG NOTIFICATION ---- 🌳
export async function sendLogNotification(
  props: {
    message: string;
    topic: "event" | "ticket" | "system" | "payments";
    image?: string | null;
    inline_keyboard?: InlineKeyboardMarkup; // Optional property
  } = { message: "", topic: "event", image: undefined, inline_keyboard: undefined }
) {
  if (!configProtected?.bot_token_logs || !configProtected?.logs_group_id) {
    console.error("Bot token or logs group ID not found in configProtected for this environment");
    throw new Error("Bot token or logs group ID not found in configProtected for this environment");
  }

  const { bot_token_logs: BOT_TOKEN_LOGS, logs_group_id: LOGS_GROUP_ID } = configProtected;

  // Centralized topic mapping
  const topicMapping: Record<"event" | "ticket" | "system" | "payments", string | null> = {
    event: configProtected.events_topic,
    ticket: configProtected.tickets_topic,
    system: configProtected.system_topic,
    payments: configProtected.payments_topic, // Example additional topic
  };

  const topicMessageId = topicMapping[props.topic];

  if (!topicMessageId) {
    console.error(`Invalid or unconfigured topic: ${props.topic}`);
    throw new Error(`Invalid or unconfigured topic: ${props.topic}`);
  }

  const logBot = new Bot(BOT_TOKEN_LOGS);

  if (props.image) {
    return await logBot.api.sendPhoto(Number(LOGS_GROUP_ID), props.image, {
      caption: props.message,
      reply_parameters: {
        message_id: Number(topicMessageId),
      },
      reply_markup: props.inline_keyboard,
      parse_mode: "HTML",
    });
  } else {
    return await logBot.api.sendMessage(Number(LOGS_GROUP_ID), props.message, {
      reply_parameters: {
        message_id: Number(topicMessageId),
      },
      reply_markup: props.inline_keyboard,
      parse_mode: "HTML",
      link_preview_options: { is_disabled: true },
    });
  }
}

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
export const renderAddEventMessage = (username: string | number, eventData: EventRow): string => {
  const eventUuid = eventData.event_uuid;
  const eventDataWithoutDescription = removeSecretKey(removeKey(eventData, "description"));
  return `
@${username} <b>Added</b> a new event <code>${eventData.event_uuid}</code> successfully

<pre><code>${eventDataWithoutDescription}</code></pre>

Open Event: https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME}/event?startapp=${eventUuid}
  `;
};

export const renderModerationEventMessage = (username: string | number, eventData: EventRow): string => {
  const eventUuid = eventData.event_uuid;
  const eventDataWithoutDescription = removeSecretKey(removeKey(eventData, "description"));
  return `
<b>${eventData.title}</b>

${eventData.subtitle}

@${username} 

Open Event: https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME}/event?startapp=${eventUuid}
  `;
};

startBot().then(() => console.log("startBot Function Finish ;"));
