import { InlineKeyboard } from "grammy";
import { pendingCustomReplyPrompts } from "@/moderationBot/types";

export const handleSendNoticeCallback = async (
  ctx: any,
  userId: number,
  originalCaption: string,
  eventUuid: string,
  modChatId: number,
  modMessageId: number
) => {
  const promptMsg = await ctx.api.sendMessage(
    modChatId,
    `Please reply to THIS message with your notice for event <b>${eventUuid}</b>, or press Cancel.`,
    { parse_mode: "HTML" }
  );

  const finalKb = new InlineKeyboard().text("🚫 Cancel", `cancelNotice_${promptMsg.message_id}_${eventUuid}`);
  await ctx.api.editMessageReplyMarkup(modChatId, promptMsg.message_id, {
    reply_markup: finalKb,
  });

  pendingCustomReplyPrompts.set(promptMsg.message_id, {
    type: "notice",
    eventUuid,
    modChatId,
    modMessageId,
    originalCaption,
    allowedUserId: userId,
  });

  await ctx.answerCallbackQuery({ text: "Type or cancel the notice." });
  await ctx.editMessageCaption({
    caption: originalCaption + "\n\nNow waiting for your notice...",
    parse_mode: "HTML",
    reply_markup: undefined,
  });
};
