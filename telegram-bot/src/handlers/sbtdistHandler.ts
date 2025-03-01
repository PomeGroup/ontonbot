import { MyContext } from "../types/MyContext";
import { isUserAdmin } from "../db/db";

export async function sbtdistHandler(ctx: MyContext) {
  // 1) Check if admin
  const { isAdmin } = await isUserAdmin(ctx.from?.id.toString() || "");
  if (!isAdmin) {
    return ctx.reply("You are not authorized to run this command.");
  }

  // 2) Set session step to ask for event UUID
  ctx.session.sbtdistStep = "askEventUUID";
  ctx.session.sbtEventUUID = undefined; // clear any stale data
  await ctx.reply("Please provide the Event UUID:");
}
