import { MyContext } from "../types/MyContext";

/**
 * Announces the bot's addition to the group or thread, printing chat ID (and thread ID if present).
 */
export const announceBotAdded = async (ctx: MyContext) => {
  const chatId = ctx.chat.id; // e.g. -1001234567890
  const threadId = ctx.message?.message_thread_id;

  // If there's a thread ID, send a specialized message
  if (threadId) {
    await ctx.api.sendMessage(
      chatId,
      `👋 Hello! Thanks for adding The Onton Bot to a <b>thread</b>.\n\n`
      + `👥 Group/Chat ID: <code>${chatId}</code>\n`
      + `📄 Thread ID: <code>${threadId}</code>`,
      { parse_mode: "HTML" },
    );
  }

  // Announce the bot was added to the group in general
  // (If you only want to send one message total, remove this second send)
  await ctx.api.sendMessage(
    chatId,
    `👋 Hello! Thanks for adding The Onton Bot.\n\n`
    + `👥 Group/Chat ID: <code>${chatId}</code>`,
    { parse_mode: "HTML" },
  );
};