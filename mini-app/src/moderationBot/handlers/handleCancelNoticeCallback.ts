import { tgBotApprovedMenu } from "@/moderationBot/menu";
import { pendingCustomReplyPrompts } from "@/moderationBot/types";

export const handleCancelNoticeCallback = async (ctx: any, userId: number, promptId: number, evUuid: string) => {
  if (!pendingCustomReplyPrompts.has(promptId)) {
    await ctx.answerCallbackQuery({ text: "No pending notice found." });
    return;
  }
  const stored = pendingCustomReplyPrompts.get(promptId)!;
  if (stored.type !== "notice") {
    await ctx.answerCallbackQuery({ text: "This prompt was for something else." });
    return;
  }
  if (stored.allowedUserId !== userId) {
    await ctx.answerCallbackQuery({ text: "You're not allowed to cancel this prompt." });
    return;
  }
  pendingCustomReplyPrompts.delete(promptId);

  await ctx.api.editMessageCaption(stored.modChatId, stored.modMessageId, {
    caption: stored.originalCaption + "\n\nNotice canceled.\n\nBack to Approved Menu:",
    parse_mode: "HTML",
    reply_markup: tgBotApprovedMenu(evUuid),
  });

  await ctx.api.editMessageText(stored.modChatId, promptId, "Sending notice has been canceled.");
  await ctx.answerCallbackQuery({ text: "Canceled sending notice." });
};
