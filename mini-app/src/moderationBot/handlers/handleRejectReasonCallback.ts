import { InlineKeyboard } from "grammy";
import { parseRejectReason } from "@/moderationBot/menu";

export const handleRejectReasonCallback = async (
  ctx: any,
  originalCaption: string,
  eventUuid: string,
  reasonKey: string
) => {
  const confirmKb = new InlineKeyboard()
    .text("❌ Yes, Reject", `yesReject_${reasonKey}_${eventUuid}`)
    .text("🔙 Back", `noReject_${eventUuid}`);
  await ctx.editMessageCaption({
    caption: originalCaption + `\n\nAre you sure you want to reject with reason: <b>${parseRejectReason(reasonKey)}</b>?`,
    parse_mode: "HTML",
    reply_markup: confirmKb,
  });
  await ctx.answerCallbackQuery({ text: "Confirm rejection?" });
};
