import { MyContext } from "../types/MyContext";

/**
 * Checks if the bot was newly added or promoted to admin in the chat.
 */
export const isBotNewlyAddedOrPromoted = (ctx: MyContext) => {
  const oldStatus = ctx.myChatMember.old_chat_member.status;
  const newStatus = ctx.myChatMember.new_chat_member.status;

  return (
    (oldStatus === "left" || oldStatus === "kicked") &&
    (newStatus === "member" || newStatus === "administrator")
  );
};