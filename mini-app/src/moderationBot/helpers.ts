export const replyToMsgId = (ctx: any) => ctx.message.reply_to_message?.message_id || 0;

/**
 * Based on how many total notices the owner has, return an emoji:
 *  - 0 => White circle (⚪)
 *  - 1..3 => Yellow circle (🟡)
 *  - 4 or more => Red circle (🔴)
 */
export const getNoticeEmoji = (totalNotices: number): string => {
  if (totalNotices === 0) return "⚪";
  if (totalNotices < 4) return "🟡";
  return "🔴";
};
