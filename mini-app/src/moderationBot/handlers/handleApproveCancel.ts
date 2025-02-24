import { tgBotModerationMenu } from "@/moderationBot/menu";

export const handleApproveCancel = async (ctx: any, originalCaption: string, eventUuid: string) => {
  await ctx.editMessageCaption({
    caption: originalCaption + "\n\nApproval canceled.\n\nBack to main menu:",
    parse_mode: "HTML",
    reply_markup: tgBotModerationMenu(eventUuid),
  });
  await ctx.answerCallbackQuery({ text: "Canceled." });
};
