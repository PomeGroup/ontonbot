import { Composer } from "grammy";
import { MyContext } from "../types/MyContext";
import {
  getPlay2winFeatured,
  isUserAdmin,
  upsertPlay2winFeatured,
} from "../db/db";
import { logger } from "../utils/logger";
import { isNewCommand } from "../helpers/isNewCommand";

export const play2winFeatured = new Composer<MyContext>();

/**
 * /play2winfeatured command entry point:
 * - Checks admin
 * - Sets session step
 * - Shows current list or "empty"
 */
play2winFeatured.command("play2winfeatured", async (ctx) => {
  // 1. Check if user is admin
  const { isAdmin } = await isUserAdmin(ctx.from?.id.toString() || "");
  if (!isAdmin) {
    // If not admin, just ignore or reply with an error
    return;
  }
  logger.log(`User ${ctx.from?.id} is an admin for /play2winfeatured`);
  // 2. Fetch current list
  const currentList = await getPlay2winFeatured();

  // 3. Inform user & set step
  ctx.session.play2winStep = "askList";
  await ctx.reply(
    `🎮 Send me the new list of tournament IDs.\n\n` +
    `Current List: <code>${currentList || "empty"}</code>\n` +
    `Example: <code>123,456,789</code>\n\n` +
    `Type /cancel to cancel the operation.`
    ,
    { parse_mode: "HTML" },
  );
});

/**
 * Global text handler:
 * - This will handle the user replies based on the current session step.
 */
play2winFeatured.on("message:text", async (ctx, next) => {
  if (isNewCommand(ctx)) {
    ctx.session = {};
    return next();
  }
  const step = ctx.session.play2winStep;

  // If there's no step in session or it's "done", do nothing.
  if (!step || step === "done") return next();

  // Handle logic based on current step
  if (step === "askList") {
    await handleAskList(ctx, next);
  }
});

/* -------------------------------------------------------------------------- */
/*                             Handler Functions                              */

/* -------------------------------------------------------------------------- */

/**
 * handleAskList:
 * - /cancel => cancels operation
 * - /empty => empties DB
 * - Else => Validate input & update
 */
async function handleAskList(ctx: MyContext, next: () => void) {
  const userText = ctx.message?.text?.trim();
  logger.log(`User text: ${userText}`);
  // Safety check
  if (!userText) return;


  // 3. Validate comma-separated IDs
  const regex = /^(\d+)(,\d+)*$/;
  if (!regex.test(userText)) {
    await ctx.reply(
      "❌ Invalid input. Please send a comma-separated list of tournament IDs, e.g. 123,456,789.",
    );
    // *Don't* reset the step so the user can try again
    return;
  }

  // 4. Save to DB
  await upsertPlay2winFeatured(userText);
  logger.log(`Updated the list with: ${userText}`);
  await ctx.reply("✅ Updated the list with the received data");

  // 5. Mark flow as done
  ctx.session.play2winStep = "done";
}
