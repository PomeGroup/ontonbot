import { Bot, Composer } from "grammy"
import { fetchOntonSetting } from "../db/ontonSettings"
import { isNewCommand } from "../helpers/isNewCommand"
import { MyContext } from "../types/MyContext"

export const channelPostButtonComposer = new Composer<MyContext>();

/**
 * Global text handler:
 * - This will handle the user replies based on the current session step.
 */
channelPostButtonComposer.on("message:text", async (ctx, next) => {
  if (isNewCommand(ctx)) {
    ctx.session = {};
    return next();
  }

  // Refactored the wait step logic into separate handler functions
  if (ctx.session.channelButtonStep === "askPostId") {
    await handleAskPostId(ctx);
    return;
  }

  if (ctx.session.channelButtonStep === "editButton") {
    await handleEditButton(ctx);
    return;
  }
});

/* -------------------------------------------------------------------------- */
/*                             Handler Functions                              */
/* -------------------------------------------------------------------------- */

// New handler functions for step logic
async function handleAskPostId(ctx: MyContext) {
  const trimmed = ctx.message.text.trim();
  if (/^\d+$/.test(trimmed)) {
    ctx.session.channelButtonPostId = Number(trimmed);
    ctx.session.channelButtonStep = "editButton";
    await ctx.reply("Post found. Now please send a link and button text separated by a comma (e.g., http://example.com,Button Text).");
  }
}

async function handleEditButton(ctx: MyContext) {
  const parts = ctx.message.text.split(",");
  const {configProtected} = await fetchOntonSetting()
  const announcement_channel_id = configProtected['announcement_channel_id']
  const announcementBotId = configProtected['check_join_bot_token']

  if (!announcement_channel_id) {
    await ctx.reply("❌ Announcement channel ID is not configured. Please contact the administrator.");
    return;
  }

  const parsedChannelId = parseInt(announcement_channel_id, 10);
  if (isNaN(parsedChannelId)) {
    await ctx.reply("❌ Invalid announcement channel ID. Please contact the administrator.");
    return;
  }

  const buttonBot = new Bot(announcementBotId)

  if (parts.length < 2) {
    await ctx.reply("❌ Invalid input. Please send a link and button text separated by a comma.");
    return;
  }
  const link = parts[0].trim();
  const buttonText = parts.slice(1).join(",").trim();
  const postId = ctx.session.channelButtonPostId as number;
  try {
    await buttonBot.api.editMessageReplyMarkup(parsedChannelId, postId, {
      reply_markup: {
        inline_keyboard: [[{text: buttonText, url: link}]]
      }
    });
    await ctx.reply("✅ Post updated with the new inline button.");
  } catch (error) {
    await ctx.reply("❌ Failed to update the post. Ensure the bot has enough rights in the channel.");
  }
  // Clear channel button session
  ctx.session.channelButtonStep = undefined;
  ctx.session.channelButtonPostId = undefined;
}


/* -------------------------------------------------------------------------- */
/*                                Commands                                    */
/* -------------------------------------------------------------------------- */


// Modify the /channel_button command handler to ask for post ID directly
channelPostButtonComposer.command("channel_button", async (ctx) => {
  // Removed fetching posts & inline keyboard code
  ctx.session.channelButtonStep = "askPostId";
  await ctx.reply("Please send the channel post ID to edit.");
});
