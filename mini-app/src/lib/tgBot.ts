import axios from "axios";
import { Bot, BotError, GrammyError, InlineKeyboard } from "grammy";
import { configProtected } from "@/server/config";

const tgClient = axios.create({
  baseURL: `http://${process.env.IP_TELEGRAM_BOT}:${process.env.TELEGRAM_BOT_PORT}`,
});

import { AxiosError } from "axios";
import { removeKey, removeSecretKey } from "@/lib/utils";
import { EventRow, events } from "@/db/schema/events";
import { logger } from "@/server/utils/logger";
import { sleep } from "@/utils";
import { InlineKeyboardMarkup } from "grammy/types";
import { CreateTonSocietyDraft } from "@/server/routers/services/tonSocietyService";
import { selectEventByUuid } from "@/server/db/events";
import { registerActivity } from "./ton-society-api";
import { eq } from "drizzle-orm";
import { db } from "@/db/db";
import { userHasModerationAccess } from "@/server/db/userFlags.db";

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

async function onCallBackModerateEvent(status: string, event_uuid: string) {
  const eventData = await selectEventByUuid(event_uuid);

  if (!eventData) return false;

  const eventDraft = await CreateTonSocietyDraft(
    {
      title: eventData.title,
      subtitle: eventData.subtitle,
      description: eventData.description,
      location: eventData.location!,
      countryId: eventData.countryId,
      society_hub: { id: eventData.society_hub_id! },
      start_date: eventData.start_date,
      end_date: eventData.end_date,
      ts_reward_url: eventData.tsRewardImage,
      video_url: eventData.tsRewardVideo,
      eventLocationType: eventData.participationType,
    },
    event_uuid
  );
  let ton_society_result = undefined;
  if (!eventData.activity_id) ton_society_result = await registerActivity(eventDraft);

  if (eventData.activity_id || ton_society_result) {
    const activity_id = eventData.activity_id || ton_society_result!.data.activity_id;
    const update_result = await db.transaction(async (trx) => {
      await trx
        .update(events)
        .set({
          activity_id: activity_id,
          hidden: false,
          enabled: true,
          updatedBy: "Moderation-Approve",
          updatedAt: new Date(),
        })
        .where(eq(events.event_uuid, event_uuid))
        .execute();
      logger.log(`paid_event_add_activity_${eventData.event_uuid}_${activity_id}`);
    });

    const event = await db.query.events.findFirst({
      where: eq(events.event_uuid, event_uuid),
      columns: {
        activity_id: true,
      },
    });

    logger.log("tgBot_moderation_approve event_uuid , activity_id", event_uuid, event?.activity_id);
    return event?.activity_id;
  }

  return false;
}

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
        console.log("callback_query_with_payload : ", payload);

        const [status, event_uuid] = payload.split("_");

        // console.log();

        // logger.log("CTX" , ctx);

        // console.log("CTX_MESSAGE" , ctx.update.message);

        const orignal_text = ctx.update?.callback_query.message?.caption || "";
        const user_id = ctx.update.callback_query.from.id;
        const username = "@" + ctx.update.callback_query.from.username || "";
        const first_name = ctx.update.callback_query.from.first_name || "";
        const last_name = ctx.update.callback_query.from.last_name || "";
        const user_details = `\n<b>${first_name} ${last_name}</b> <code>${username}</code> <code>${user_id}</code>`;

        // if (!(await userHasModerationAccess(user_id, "user"))) {
        //   await ctx.answerCallbackQuery({ text: "Unauthorized" });
        //   return;
        // }
        const new_text =
          orignal_text + "\n\nStatus : " + (status === "approve" ? "✅ Approved By " : "❌ Rejected By ") + user_details;

        let update_completed = true;
        if (status === "approve")
          try {
            update_completed = !!(await onCallBackModerateEvent(status, event_uuid));
          } catch (error) {
            logger.error("onCallBackModerateEvent_approve_failed", error);
            update_completed = false;
          }

        if (update_completed) {
          const reply_markup =
            status === "approve"
              ? undefined // No Button For approved events
              : new InlineKeyboard().text("✅ Approve Rejected Event", `approve_${event_uuid}`);
          // Rejected Events Can be published
          ctx.editMessageCaption({
            caption: new_text,
            reply_markup,
            parse_mode: "HTML",
          });
        }

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
    group_id?: number | string | null;
  } = { message: "", topic: "event", image: undefined, inline_keyboard: undefined, group_id: undefined }
) {
  if (!configProtected?.bot_token_logs || !configProtected?.logs_group_id) {
    console.error("Bot token or logs group ID not found in configProtected for this environment");
    throw new Error("Bot token or logs group ID not found in configProtected for this environment");
  }

  let { bot_token_logs: BOT_TOKEN_LOGS, logs_group_id: LOGS_GROUP_ID } = configProtected;

  if (props.group_id) {
    LOGS_GROUP_ID = props.group_id.toString();
  }

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
