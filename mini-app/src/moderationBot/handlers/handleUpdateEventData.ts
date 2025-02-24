import eventDB from "@/server/db/events";
import moderationLogDB from "@/server/db/moderationLogger.db";
import { tgBotModerationMenu } from "@/moderationBot/menu";
import { getNoticeEmoji } from "@/moderationBot/helpers";

export const handleUpdateEventData = async (ctx: any, originalCaption: string, eventUuid: string) => {
  // 1) Fetch the latest event data
  const updatedEvent = await eventDB.selectEventByUuid(eventUuid);
  if (!updatedEvent) {
    await ctx.answerCallbackQuery({ text: "Event not found." });
    return;
  }

  // 2) Count total notices for the event owner
  const totalNotices = await moderationLogDB.getNoticeCountForOwner(updatedEvent.owner);

  // 3) Get the circle emoji (⚪ / 🟡 / 🔴) based on total notices
  const circleEmoji = getNoticeEmoji(totalNotices);

  // 4) Build a new caption
  //    You can include whatever updated data you want (e.g., new event fields).
  //    Also include the notice info: e.g. “⚪ This user has 0 notices.”
  const newCaption = `
<b>${updatedEvent.title}</b> 

${updatedEvent.subtitle}

<b> ${circleEmoji} Notices:</b> This user has <b>${totalNotices}</b> total notice(s).

Open Event: https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME}/event?startapp=${eventUuid}
`.trim();

  // 5) Update the moderator’s caption
  //    If you also want to update the photo, you could use ctx.api.editMessageMedia,
  //    but here we just edit the caption:
  await ctx.editMessageCaption({
    caption: newCaption,
    parse_mode: "HTML",
    // If the event is still in a "pre-approve" state, use tgBotModerationMenu;
    // if it's already approved, you could show tgBotApprovedMenu instead.
    reply_markup: tgBotModerationMenu(eventUuid),
  });

  // 6) Let the moderator know we handled their action
  await ctx.answerCallbackQuery({ text: "Event data updated!" });
};
