import { logger } from "@/server/utils/logger";
import eventDB from "@/server/db/events";
import moderationLogDB from "@/server/db/moderationLogger.db";
import { tgBotApprovedMenu } from "@/moderationBot/menu";
import { onCallBackModerateEvent } from "@/moderationBot/callBacks/onCallBackModerateEvent";
import { sendTelegramMessage } from "@/lib/tgBot";

export const handleApproveConfirm = async (
  ctx: any,
  userId: number,
  originalCaption: string,
  user_details: string,
  eventUuid: string
) => {
  let update_completed = true;
  try {
    const result = await onCallBackModerateEvent("approve", eventUuid);
    // result may be truthy or "false" in local mode
    update_completed = !!result || result === false;
  } catch (err) {
    logger.error("onCallBackModerateEvent_approve_failed", err);
    update_completed = false;
  }

  if (update_completed) {
    const eventData = await eventDB.selectEventByUuid(eventUuid);
    if (eventData) {
      // 1) Insert moderation log
      await moderationLogDB.insertModerationLog({
        moderatorUserId: userId,
        eventUuid,
        eventOwnerId: eventData.owner,
        action: "APPROVE",
      });

      // 2) Send "approved" message to the organizer
      await sendTelegramMessage({
        chat_id: Number(eventData.owner),
        message: `✅<b>Congratulations!</b>\nYour event <b>(${eventData.title})</b> has been approved.`,
      });
    }

    // 3) Update the moderator’s caption
    const newCap = originalCaption + "\n\nStatus : ✅ Approved By " + user_details;
    await ctx.editMessageCaption({
      caption: newCap,
      parse_mode: "HTML",
      reply_markup: tgBotApprovedMenu(eventUuid),
    });
  }

  // 4) Let the moderator know it’s done
  await ctx.answerCallbackQuery({ text: "Event approved!" });
};
