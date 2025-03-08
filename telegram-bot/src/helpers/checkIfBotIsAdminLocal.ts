import { Api, RawApi } from "grammy";

export async function checkIfBotIsAdminLocal(chatId: number, api: Api<RawApi>) {
  try {
    // 1) Identify the bot's own user ID
    const me = await api.getMe();
    const botId = me.id;

    // 2) Check membership status
    const chatMember = await api.getChatMember(chatId, botId);
    const isAdmin =
      chatMember.status === "administrator" || chatMember.status === "creator";

    // 3) Get chat info
    const chatInfo = await api.getChat(chatId);

    return {
      success: isAdmin,
      chatInfo: {
        id: chatInfo.id,
        type: chatInfo.type,
        title: chatInfo.title,
      },
    };
  } catch (err) {
    // You could handle specific error codes here, e.g. 429 rate limit
    console.error("checkIfBotIsAdminLocal error:", err);
    return {
      success: false,
    };
  }
}
