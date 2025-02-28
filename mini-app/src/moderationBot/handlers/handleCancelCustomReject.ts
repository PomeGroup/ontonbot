import { tgBotModerationMenu } from "@/moderationBot/menu";
import { pendingCustomReplyPrompts } from "@/moderationBot/types";

export const handleCancelCustomReject = async (ctx: any, userId: number, promptId: number, evUuid: string) => {
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
};
