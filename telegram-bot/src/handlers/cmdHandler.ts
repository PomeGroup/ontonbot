import { Context } from "grammy";
import { isUserAdmin } from "../db/db";
import { hideCmd } from "../db/cmd.db";
import { sendTopicMessage } from "../utils/logs-bot";
import { editOrSend } from "../utils/utils";
import { startKeyboard } from "../markups";

export const cmdHandler = async (ctx: Context, next: () => Promise<void>) => {
  // get user from database
  const { isAdmin } = await isUserAdmin(ctx.from.id.toString());

  if (!isAdmin) {
    return await ctx.reply(`You are not authorized to perform this operation.`);
  }

  try {
    // @ts-ignore
    const messageText = ctx.message?.text;

    if (messageText && messageText.split(" ")[0] === "/cmd") {
      const payload = messageText.split(" ");

      const cmd = payload[1].toLowerCase();
      if (cmd === "hide" || cmd === "unhide") {
        const hide = cmd.toLowerCase() === "hide";
        const event_uuid = payload[2];

        await hideCmd(event_uuid, hide)
          .then(async () => {
            const message = `Event ${event_uuid} Hidden : ${hide}`;

            await sendTopicMessage("organizers_topic", message);

            await editOrSend(ctx, message, startKeyboard());
          })
          .catch(async (error) => {
            await editOrSend(ctx, `went wrong ${error}`, startKeyboard());
          });
      }
    } else {
      await editOrSend(ctx, `Invalid command.`, startKeyboard());
    }
  } catch (error) {
    await editOrSend(ctx, `Error.`, startKeyboard());
  }
};
