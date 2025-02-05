import axios from "axios";
import { Bot, GrammyError, InputFile } from "grammy";
import { InlineKeyboard } from "grammy"; // InputMediaPhoto for editing media
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
import { getEventByUuid } from "@/server/db/events";
import { userHasModerationAccess } from "@/server/db/userFlags.db";
import { InputMediaPhoto } from "grammy/types";
import { eq } from "drizzle-orm";
import { db } from "@/db/db";
import { parseRejectReason, tgBotModerationMenu } from "@/lib/TgBotTools";
import { formatDate } from "@/lib/DateAndTime";
import { selectUserById } from "@/server/db/users";

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

// =========== Approve Event in TonSociety etc. ===========
async function onCallBackModerateEvent(_status: string, event_uuid: string) {
  const eventData = await selectEventByUuid(event_uuid);
  const isLocal = process.env.ENV === "local";
  if (!eventData) return false;

  if (!isLocal) {
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
    if (!eventData.activity_id) {
      ton_society_result = await registerActivity(eventDraft);
    }

    if (eventData.activity_id || ton_society_result) {
      const activity_id = eventData.activity_id || ton_society_result!.data.activity_id;
      await db.transaction(async (trx) => {
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

      const updatedEvent = await db.query.events.findFirst({
        where: eq(events.event_uuid, event_uuid),
        columns: {
          activity_id: true,
        },
      });

      logger.log("tgBot_moderation_approve event_uuid , activity_id", event_uuid, updatedEvent?.activity_id);
      return updatedEvent?.activity_id;
    } else {
      return null;
    }
  }

  return false;
}

/** For the "reject custom" flow, store data keyed by prompt message ID */
interface PendingCustomReply {
  eventUuid: string;
  modChatId: number;
  modMessageId: number;
  originalCaption: string;
  allowedUserId: number;
}

const pendingCustomReplyPrompts = new Map<number, PendingCustomReply>();

// =========== Start Bot ===========
async function startBot() {
  while (true) {
    if (!configProtected?.bot_token_logs || !configProtected?.logs_group_id) {
      logger.error("Bot token or logs group ID not found in configProtected");
      logger.error("Retrying in 5 seconds...");
      await sleep(5000);
      continue;
    }

    const { bot_token_logs: BOT_TOKEN_LOGS } = configProtected;

    try {
      const bot = new Bot(BOT_TOKEN_LOGS);

      // ----------------------------------
      // 1) Handle Inline Keyboard Callbacks
      // ----------------------------------
      bot.on("callback_query:data", async (ctx) => {
        const payload = ctx.callbackQuery.data;
        logger.log("callback_query_with_payload:", payload);

        const originalCaption = ctx.update.callback_query.message?.caption || "";
        const modChatId = ctx.update.callback_query.message?.chat.id!;
        const modMessageId = ctx.update.callback_query.message?.message_id!;
        const userId = ctx.update.callback_query.from.id;

        const fromUser = ctx.update.callback_query.from;
        const username = fromUser.username ? "@" + fromUser.username : "";
        const first_name = fromUser.first_name || "";
        const last_name = fromUser.last_name || "";
        const user_details = `\n<b>${first_name} ${last_name}</b> <code>${username}</code> <code>${userId}</code>`;

        // Check moderator
        if (!(await userHasModerationAccess(userId, "user"))) {
          await ctx.answerCallbackQuery({ text: "Unauthorized Moderator" });
          return;
        }

        const parts = payload.split("_");
        const action = parts[0]; // e.g. "approve", "rejectSpam", "updateEventData"
        const eventUuid = parts[1];

        // ============= APPROVE (Two-step) ============
        if (action === "approve") {
          const confirmKb = new InlineKeyboard()
            .text("✅ Yes, Approve", `yesApprove_${eventUuid}`)
            .text("🔙 Back", `noApprove_${eventUuid}`);
          await ctx.editMessageCaption({
            caption: originalCaption + "\n\nAre you sure to approve?",
            parse_mode: "HTML",
            reply_markup: confirmKb,
          });
          await ctx.answerCallbackQuery({ text: "Confirm approval?" });
          return;
        }
        if (action === "yesApprove") {
          let update_completed = true;
          const isLocal = process.env.ENV === "local";
          if (!isLocal) {
            try {
              update_completed = !!(await onCallBackModerateEvent("approve", eventUuid));
            } catch (err) {
              logger.error("onCallBackModerateEvent_approve_failed", err);
              update_completed = false;
            }
          }
          if (update_completed) {
            const newCap = originalCaption + "\n\nStatus : ✅ Approved By " + user_details;
            await ctx.editMessageCaption({
              caption: newCap,
              parse_mode: "HTML",
              reply_markup: undefined,
            });
          }
          await ctx.answerCallbackQuery({ text: "Event approved!" });
          return;
        }
        if (action === "noApprove") {
          await ctx.editMessageCaption({
            caption: originalCaption + "\n\nApproval canceled.\n\nBack to main menu:",
            parse_mode: "HTML",
            reply_markup: tgBotModerationMenu(eventUuid),
          });
          await ctx.answerCallbackQuery({ text: "Canceled." });
          return;
        }

        // ============= Update Event Data (Demo) ============
        if (action === "updateEventData") {
          // Demonstration: fetch event, pretend to update DB, then edit the caption
          const updatedEvent = await getEventByUuid(eventUuid);
          const ownerInfo = await selectUserById(updatedEvent.owner!!);

          const updatedCaption = `
<b>${updatedEvent.title} (Updated in ${formatDate(Date.now() / 1000)})</b>

${updatedEvent.subtitle}

${ownerInfo?.username ? `@${ownerInfo.username}` : `no username <code>${ownerInfo?.user_id}</code>`} 

Open Event: https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME}/event?startapp=${eventUuid}
(This text is newly updated!)
`.trim();

          await ctx.editMessageCaption({
            caption: updatedCaption,
            parse_mode: "HTML",
            reply_markup: tgBotModerationMenu(eventUuid),
          });
          // Let's pretend we have a new photo URL or file_id
          const newPhotoUrl = updatedEvent.image_url || "https://onton.live/template-images/default.webp";

          // We'll build a new InputMediaPhoto object
          const newMedia: InputMediaPhoto = {
            type: "photo",
            media: newPhotoUrl,
            caption: updatedCaption,
            parse_mode: "HTML",
          };
          // Then call editMessageMedia:
          // We must pass either chat_id + message_id OR inline_message_id
          await ctx.api.editMessageMedia(modChatId, modMessageId, newMedia, {
            reply_markup: tgBotModerationMenu(eventUuid), // keep the same menu
          });
          await ctx.answerCallbackQuery({
            text: `Event data updated!`,
            show_alert: true,
          });
          return;
        }

        // ============= REJECT (Custom) =============
        if (action === "rejectCustom") {
          const promptMsg = await ctx.api.sendMessage(
            modChatId,
            `Please reply to THIS message with your custom reason for event <b>${eventUuid}</b>, or press Cancel.`,
            { parse_mode: "HTML" }
          );
          const finalKb = new InlineKeyboard().text("🚫 Cancel", `cancelCustom_${promptMsg.message_id}_${eventUuid}`);
          await ctx.api.editMessageReplyMarkup(modChatId, promptMsg.message_id, {
            reply_markup: finalKb,
          });
          pendingCustomReplyPrompts.set(promptMsg.message_id, {
            eventUuid,
            modChatId,
            modMessageId,
            originalCaption,
            allowedUserId: userId,
          });
          await ctx.editMessageCaption({
            caption: originalCaption + "\n\nNow waiting for custom reason...",
            parse_mode: "HTML",
            reply_markup: undefined,
          });
          await ctx.answerCallbackQuery({ text: "Type or cancel the custom reason." });
          return;
        }

        // ============= Cancel Custom Rejection =============
        if (action === "cancelCustom" && parts.length === 3) {
          const promptId = Number(parts[1]);
          const evUuid = parts[2];

          if (!pendingCustomReplyPrompts.has(promptId)) {
            await ctx.answerCallbackQuery({ text: "No pending custom reason found." });
            return;
          }
          const stored = pendingCustomReplyPrompts.get(promptId)!;
          if (stored.allowedUserId !== userId) {
            await ctx.answerCallbackQuery({ text: "You're not allowed to cancel this prompt." });
            return;
          }
          pendingCustomReplyPrompts.delete(promptId);

          await ctx.api.editMessageCaption(stored.modChatId, stored.modMessageId, {
            caption: stored.originalCaption + "\n\nRejection canceled.\n\nBack to main menu:",
            parse_mode: "HTML",
            reply_markup: tgBotModerationMenu(evUuid),
          });

          await ctx.api.editMessageText(stored.modChatId, promptId, "Custom rejection canceled.");

          await ctx.answerCallbackQuery({ text: "Canceled custom reason." });
          return;
        }

        // ============= REJECT (Standard) =============
        if (action.startsWith("reject") && action !== "rejectCustom" && action !== "cancelCustom") {
          const reasonKey = action.replace("reject", "");
          const confirmKb = new InlineKeyboard()
            .text("❌ Yes, Reject", `yesReject_${reasonKey}_${eventUuid}`)
            .text("🔙 Back", `noReject_${eventUuid}`);
          await ctx.editMessageCaption({
            caption:
              originalCaption + `\n\nAre you sure you want to reject with reason: <b>${parseRejectReason(reasonKey)}</b>?`,
            parse_mode: "HTML",
            reply_markup: confirmKb,
          });
          await ctx.answerCallbackQuery({ text: "Confirm rejection?" });
          return;
        }

        if (action === "yesReject" && parts.length === 3) {
          const reasonKey = parts[1];
          const evId = parts[2];

          const eventData = await selectEventByUuid(evId);
          if (eventData) {
            await sendTelegramMessage({
              chat_id: Number(eventData.owner),
              message: `❌Your Event <b>(${eventData.title})</b> Has Been Rejected.\nReason: ${parseRejectReason(
                reasonKey
              )}`,
            });
          }
          const newCap =
            originalCaption + "\n\nStatus : ❌ Rejected By " + user_details + `\nReason: ${parseRejectReason(reasonKey)}`;

          const repMarkup = new InlineKeyboard()
            .text("✅ Approve Rejected Event", `approve_${evId}`)
            .row()
            .text("🔃 Update Data", `updateEventData_${eventUuid}`);

          await ctx.editMessageCaption({
            caption: newCap,
            parse_mode: "HTML",
            reply_markup: repMarkup,
          });
          await ctx.answerCallbackQuery({ text: "Event rejected!" });
          return;
        }

        if (action === "noReject") {
          await ctx.editMessageCaption({
            caption: originalCaption + "\n\nRejection canceled.\n\nBack to main menu:",
            parse_mode: "HTML",
            reply_markup: tgBotModerationMenu(eventUuid),
          });
          await ctx.answerCallbackQuery({ text: "Canceled." });
          return;
        }

        // unknown action
        await ctx.answerCallbackQuery({ text: "Unknown action" });
      });

      // ----------------------------------
      // 2) Text messages (custom reason flow)
      // ----------------------------------
      bot.on("message:text", async (ctx) => {
        const replyTo = ctx.message.reply_to_message;
        if (!replyTo) return;

        const promptId = replyTo.message_id;
        if (!pendingCustomReplyPrompts.has(promptId)) {
          return;
        }

        const { eventUuid, modChatId, modMessageId, originalCaption, allowedUserId } =
          pendingCustomReplyPrompts.get(promptId)!;

        const userId = ctx.from.id;
        if (userId !== allowedUserId) {
          await ctx.reply("You are not the moderator who triggered this custom reason prompt!");
          return;
        }

        // finalize
        pendingCustomReplyPrompts.delete(promptId);

        const typedReason = ctx.message.text;
        const eventData = await selectEventByUuid(eventUuid);
        if (eventData) {
          await sendTelegramMessage({
            chat_id: Number(eventData.owner),
            message: `❌Your Event <b>(${eventData.title})</b> Has Been Rejected.\nReason: ${typedReason}`,
          });
        }

        const first_name = ctx.from.first_name || "";
        const last_name = ctx.from.last_name || "";
        const username = ctx.from.username ? "@" + ctx.from.username : "";
        const user_details = `\n<b>${first_name} ${last_name}</b> <code>${username}</code> <code>${userId}</code>`;

        const newCap = originalCaption + "\n\nStatus : ❌ Rejected By " + user_details + `\nReason: ${typedReason}`;

        const repMarkup = new InlineKeyboard().text("✅ Approve Rejected Event", `approve_${eventUuid}`);
        await ctx.api.editMessageCaption(modChatId, modMessageId, {
          caption: newCap,
          parse_mode: "HTML",
          reply_markup: repMarkup,
        });

        await ctx.api.editMessageText(modChatId, promptId, "Your custom rejection reason has been recorded. Thank you!");
      });

      // Start the bot
      await bot.start({
        onStart: () => logger.log("Started moderation bot successfully."),
      });
      logger.log("Started The Moderation/Logger Bot Successfully");
      break;
    } catch (error) {
      if (error instanceof GrammyError) {
        if (error.error_code === 409) {
          // Bot is already running or conflict
          return;
        }
      }
      logger.error("Error while starting the bot. Retrying in 5 seconds...", error);
      await sleep(5000);
    }
  }
}

// 🌳 ---- SEND LOG NOTIFICATION ---- 🌳
export async function sendLogNotification(
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
) {
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
}

// =========== RENDER FUNCTIONS ===========

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

export const renderAddEventMessage = (username: string | number, eventData: EventRow): string => {
  const eventUuid = eventData.event_uuid;
  const eventDataWithoutDescription = removeSecretKey(removeKey(eventData, "description"));
  return `
@${username} <b>Added</b> a new event <code>${eventUuid}</code> successfully

<pre><code>${eventDataWithoutDescription}</code></pre>

Open Event: https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME}/event?startapp=${eventUuid}
`;
};

export const renderModerationEventMessage = (username: string | number, eventData: EventRow): string => {
  const eventUuid = eventData.event_uuid;
  return `
<b>${eventData.title}</b>

${eventData.subtitle}

@${username}

Open Event: https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME}/event?startapp=${eventUuid}
`;
};

// Finally start the bot
startBot().then(() => logger.log("startBot Function Finish ;"));
