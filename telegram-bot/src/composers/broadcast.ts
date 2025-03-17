import { Composer, InlineKeyboard } from "grammy";
import { MyContext } from "../types/MyContext";
import { isUserAdmin, getEvent, getEventTickets } from "../db/db";
import { logger } from "../utils/logger";
import { isNewCommand } from "../helpers/isNewCommand";
import { sleep } from "../utils/utils";
import { sendMessageWithInfinityRetry } from "../helpers/sendMessageWithInfinityRetry";

export const broadcastComposer = new Composer<MyContext>();

/**
 * /broadcast command:
 * - Checks if user is admin
 * - Prompts for Event ID (UUID)
 * - Sets the step = "askEventId"
 */
broadcastComposer.command("broadcast", async (ctx) => {
  const { isAdmin } = await isUserAdmin(ctx.from?.id.toString() || "");
  if (!isAdmin) {
    return; // or ctx.reply("❌ You are not an admin.")
  }

  // Start flow
  ctx.session.broadcastStep = "askEventId";
  // Clear old data
  ctx.session.broadcastEventId = undefined;
  ctx.session.broadcastMessage = undefined;

  await ctx.reply("📣 Please send the event ID (UUID) you want to broadcast. \nType /cancel to abort.");
});

/**
 * Handle user replies (text messages) based on the current broadcastStep
 */
broadcastComposer.on("message:text", async (ctx, next) => {
  // If user typed a new command, reset session and go next
  if (isNewCommand(ctx)) {
    ctx.session = {};
    return next();
  }

  const step = ctx.session.broadcastStep;
  if (!step || step === "done") {
    return next(); // Not in this flow
  }

  if (step === "askEventId") {
    return handleAskEventId(ctx);
  }

  if (step === "askMessage") {
    return handleAskMessage(ctx);
  }

  // If we’re in "confirm" step but user typed text,
  // we might choose to ignore or respond. We'll ignore here.
  return next();
});

/**
 * Handle Inline Button callbacks for the broadcast flow
 */
broadcastComposer.on("callback_query:data", async (ctx, next) => {
  const step = ctx.session.broadcastStep;
  if (!step || step === "done") {
    return next();
  }

  // If we're in the "confirm" step, check the callback data
  if (step === "confirm") {
    const data = ctx.callbackQuery.data;
    if (data === "confirmBroadcast") {
      // Perform broadcast
      await handleBroadcastConfirm(ctx);
    } else if (data === "cancelBroadcast") {
      // Cancel
      await ctx.answerCallbackQuery(); // acknowledges button press
      await ctx.reply("❌ Broadcast canceled.");
      ctx.session.broadcastStep = "done";
    } else {
      return next();
    }
  }
});

/* -------------------------------------------------------------------------- */
/*                             Handler Functions                              */

/* -------------------------------------------------------------------------- */

/**
 * 1) Ask Event ID (UUID)
 * - Validate user input
 * - If invalid => stop flow
 * - If valid => ask for broadcast message
 */
async function handleAskEventId(ctx: MyContext) {
  const eventIdCandidate = ctx.message?.text?.trim();
  if (!eventIdCandidate) return;

  // Quick check if it "looks" like a UUID.
  // If you trust your DB function, you can skip or do a more advanced check.
  // Or you can do zod validations if you prefer.
  // For example:
  if (!/^[0-9a-fA-F-]{36}$/.test(eventIdCandidate)) {
    await ctx.reply("❌ Invalid event ID (must be a UUID). Flow canceled.");
    ctx.session.broadcastStep = "done";
    return;
  }

  // Check if the event actually exists
  const event = await getEvent(eventIdCandidate);
  if (!event) {
    await ctx.reply("❌ Event not found. Flow canceled.");
    ctx.session.broadcastStep = "done";
    return;
  }

  // Store the event ID in session
  ctx.session.broadcastEventId = eventIdCandidate;

  // Move to next step: ask for broadcast message
  ctx.session.broadcastStep = "askMessage";
  await ctx.reply("✅ Event found.\nNow send the message you want to broadcast.");
}

/**
 * 2) Ask broadcast message
 * - Store the message text
 * - Show inline keyboard to confirm or cancel
 */
async function handleAskMessage(ctx: MyContext) {
  const broadcastMessage = ctx.message?.text?.trim();
  if (!broadcastMessage) return;

  // Store in session
  ctx.session.broadcastMessage = broadcastMessage;

  // Move to "confirm"
  ctx.session.broadcastStep = "confirm";

  // Build an inline keyboard with confirm & cancel
  const keyboard = new InlineKeyboard()
    .text("✅ Confirm", "confirmBroadcast")
    .text("❌ Cancel", "cancelBroadcast");

  await ctx.reply(
    `Do you want to broadcast this message?\n\n<code>${broadcastMessage}</code>`,
    {
      parse_mode: "HTML",
      reply_markup: keyboard,
    },
  );
}

/**
 * 3) Confirm broadcast
 * - If user taps "Confirm", we fetch all tickets, broadcast, then done
 */
async function handleBroadcastConfirm(ctx: MyContext) {
  await ctx.answerCallbackQuery(); // Acknowledge button

  const eventId = ctx.session.broadcastEventId;
  const message = ctx.session.broadcastMessage;
  if (!eventId || !message) {
    await ctx.reply("❌ Missing event ID or message. Cannot broadcast.");
    ctx.session.broadcastStep = "done";
    return;
  }

  // 1) Fetch ticket holders
  const tickets = await getEventTickets(eventId);
  if (!tickets?.length) {
    await ctx.reply("No tickets found for this event. Nothing to broadcast.");
    ctx.session.broadcastStep = "done";
    return;
  }

  // 2) Broadcast loop
  logger.log(`Broadcasting to ${tickets.length} users... by user ${ctx.from?.id} (${ctx.from?.username})`);
  await ctx.reply(`📣 Broadcasting to ${tickets.length} users...`);
  for (let i = 0; i < tickets.length; i++) {
    const ticket = tickets[i];
    await sendMessageWithInfinityRetry(ticket.user_id, message, ctx);

    // Optional: progress updates
    if (i > 0 && i % 100 === 0) {
      await ctx.reply(`ℹ️  ${i} users have received the message so far...`);
    }

    // Let's not spam Telegram too quickly
    await sleep(50);
  }

  // 3) Done
  await ctx.reply(`✅ Broadcast completed. ${tickets.length} users have received the message.`);
  ctx.session.broadcastStep = "done";
}


