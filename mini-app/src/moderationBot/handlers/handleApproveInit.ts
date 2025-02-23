import { InlineKeyboard } from "grammy";

export const handleApproveInit = async (ctx: any, originalCaption: string, eventUuid: string) => {
  const confirmKb = new InlineKeyboard()
    .text("✅ Yes, Approve", `yesApprove_${eventUuid}`)
    .text("🔙 Back", `noApprove_${eventUuid}`);
  await ctx.editMessageCaption({
    caption: originalCaption + "\n\nAre you sure to approve?",
    parse_mode: "HTML",
    reply_markup: confirmKb,
  });
  await ctx.answerCallbackQuery({ text: "Confirm approval?" });
};
