import { Context } from "telegraf"
import { addVisitor, changeRole, isUserAdmin } from "./db/db"
import { startKeyboard } from "./markups"
import { TVisitor } from "./utils/types"
import { editOrSend } from "./utils/utils"

export const orgHandler = async (ctx: Context, next: () => Promise<void>) => {
  // get user from database
  const {isAdmin} = await isUserAdmin(ctx.from.id.toString())
  
  if (!isAdmin) {
    return await ctx.reply(`You are not authorized to perform this operation.`)
  }


  try {
    // @ts-ignore
    const messageText = ctx.message?.text;

    if (
      messageText &&
      messageText.split(" ").length === 3 &&
      messageText.split(" ")[0] === "/org"
    ) {
      const role = messageText.split(" ")[1];
      const username = messageText.split(" ")[2];

      // role should be user, admin, organizer otherwise throw a nice error

      if (!["user", "admin", "organizer"].includes(role)) {
        await editOrSend(
          ctx,
          `Invalid role. Must be one of: user, admin, organizer.`,
          startKeyboard(),
        )

        next()
        return
      }

      await changeRole(role, username).then(async () => {
        await editOrSend(
          ctx,
          `Role for ${username} changed to ${role}.`,
          startKeyboard(),
        );
      }).catch(async (error) => {
        if (error instanceof Error) {
          if (error.message === 'user_not_found') {
            await editOrSend(
              ctx,
              `User with username: ${username} does not exist.`,
              startKeyboard(),
            );
          }

          if (error.message === 'nothing_to_update') {
            await editOrSend(
              ctx,
              `Nothing to update user already is an ${role}.`,
              startKeyboard(),
            );
          }
        }
      })

    } else {
      await editOrSend(ctx, `Invalid command.`, startKeyboard());
    }
  } catch (error) {}
};

const startHandler = async (ctx: Context) => {
  try {
    addVisitor({
      telegram_id: ctx.from!.id.toString(),
      first_name: ctx.from?.first_name || "",
      last_name: ctx.from?.last_name || "",
      username: ctx.from!.username || "",
      created_at: new Date().toISOString(),
    } as TVisitor);

    // @ts-ignore
    const messageText = ctx.message?.text;
    let path = undefined;

    if (
      messageText &&
      messageText.split(" ").length === 2 &&
      messageText.split(" ")[0] === "/start"
    ) {
      path = messageText.split(" ")[1];
    }

    await editOrSend(
      ctx,
      `<b>Please click the link below to ‘Discover the App’</b>`,
      startKeyboard(),
      undefined,
      false
    );
  } catch (error) {
    console.log(error);
  }
};

export { startHandler }

