import { Composer } from "grammy";
import { MyContext } from "../types/MyContext";

export const cancelComposer = new Composer<MyContext>();

cancelComposer.command("cancel", async (ctx) => {
  let canceledSomething = false;

  ctx.session = {};

  // Provide feedback
  await ctx.reply("Operation canceled. Your active flow(s) have been cleared.");

});
