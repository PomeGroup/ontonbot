import { Context } from "grammy";
import { getEvent, isUserAdmin } from "../db/db";
import { editOrSend } from "../utils/utils";
import { setBanner } from "../db/cmd.db";
import { deleteCache } from "../lib/redisTools";

export const bannerHandler = async (
  ctx: Context,
  next: () => Promise<void>,
) => {
  // get user from database
  const { isAdmin } = await isUserAdmin(ctx.from.id.toString());

  if (!isAdmin) {
    return await ctx.reply(`You are not authorized to perform this operation.`);
  }

  try {
    // @ts-ignore
    const messageText = ctx.message?.text;
    const payload = messageText.split(" ");

    const position = payload[1].toLowerCase();
    let event_uuid = payload[2].toLowerCase();

    if (event_uuid.includes("event?startapp=")) {
      // handle link as well
      event_uuid = event_uuid.split("event?startapp=")[1];
    }
    const env = process.env.ENV;

    if (event_uuid.length !== 36) {
      await editOrSend(ctx, `Wrong Event UUID : ${event_uuid}`, undefined);
      return;
    }

    const event = await getEvent(event_uuid);
    if (!event) {
      await editOrSend(ctx, `event not found`, undefined);
      return;
    }
    await setBanner(env, position, event_uuid)
      .then(async () => {
        await deleteCache("ontonSettings");

        const message = `✅ Event ${
          event.title
        } ==> <b>${position.toUpperCase()}</b>`;

        // await sendTopicMessage("organizers_topic", message);

        await editOrSend(ctx, message, undefined);
      })
      .catch(async (error) => {
        await editOrSend(ctx, `went wrong ${error}`, undefined);
      });
  } catch (error) {
    await editOrSend(ctx, `Error.`, undefined);
  }
};
