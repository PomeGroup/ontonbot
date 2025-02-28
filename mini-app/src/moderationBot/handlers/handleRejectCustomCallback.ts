import { InlineKeyboard } from "grammy";
import { pendingCustomReplyPrompts } from "@/moderationBot/types";

export const handleRejectCustomCallback = async (
  ctx: any,
  userId: number,
  originalCaption: string,
  eventUuid: string,
  modChatId: number,
  modMessageId: number
) => {
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
    type: "reject",
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
};
