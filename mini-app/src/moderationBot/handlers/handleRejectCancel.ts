import { tgBotModerationMenu } from "@/moderationBot/menu";

export const handleRejectCancel = async (ctx: any, originalCaption: string, eventUuid: string) => {
  await ctx.editMessageCaption({
    caption: originalCaption + "\n\nRejection canceled.\n\nBack to main menu:",
    parse_mode: "HTML",
    reply_markup: tgBotModerationMenu(eventUuid),
  });
  await ctx.answerCallbackQuery({ text: "Canceled." });
};
