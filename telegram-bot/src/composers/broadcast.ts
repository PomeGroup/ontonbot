import { Composer, InlineKeyboard } from "grammy";
import { MyContext } from "../types/MyContext";
import { isUserAdmin, getEvent, getEventTickets } from "../db/db";
import { parse } from "csv-parse/sync";
import axios from "axios";
import { isNewCommand } from "../helpers/isNewCommand";
import { logger } from "../utils/logger";
import { sleep } from "../utils/utils";

export const broadcastComposer = new Composer<MyContext>();

/* -------------------------------------------------------------------------- */
/*                               Helper Function                              */

/* -------------------------------------------------------------------------- */
/**
 * copyMessageWithRetries:
 * - Tries up to 3 times to copy a message from `sourceChatId` to `targetUserId`.
 * - If it encounters a 429 (rate limit) error, waits 2 seconds, then retries.
 * - Throws an error after 3 failed attempts.
 */
async function copyMessageWithRetries(
  ctx: MyContext,
  targetUserId: string,
  sourceChatId: number,
  sourceMessageId: number,
  maxRetries = 3,
) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await ctx.api.copyMessage(targetUserId, sourceChatId, sourceMessageId);
      // If successful, return
      return true;
    } catch (error: any) {
      // If it's a rate limit error, wait 2 seconds, then retry (unless this was the last attempt)
      if (error.error_code === 429) {
        logger.warn(
          `Rate limit hit while sending to ${targetUserId}. Attempt ${attempt} of ${maxRetries}. Waiting 2s...`,
        );
        if (attempt === maxRetries) throw error;
        await sleep(2000); // wait 2 seconds
      } else {
        // For any other error, just throw immediately
        throw error;
      }
    }
  }
  // If all attempts fail for some reason (shouldn't get here unless logic changes)
  return false;
}

/* -------------------------------------------------------------------------- */
/*                           /broadcast Command                               */
/* -------------------------------------------------------------------------- */
/**
 * 1) Checks if user is admin
 * 2) Step = "chooseTarget"
 * 3) Asks user: "Event Participants" or "Custom CSV" (inline keyboard)
 */
broadcastComposer.command("broadcast", async (ctx) => {
  const { isAdmin } = await isUserAdmin(ctx.from?.id.toString() || "");
  if (!isAdmin) return; // or ctx.reply("❌ You are not an admin.")

  // Reset session
  ctx.session.broadcastStep = "chooseTarget";
  ctx.session.broadcastType = undefined;
  ctx.session.broadcastEventUuid = undefined;
  ctx.session.broadcastEventTitle = undefined;
  ctx.session.broadcastUserIds = [];
  ctx.session.broadcastCsvUserIds = [];

  // Inline keyboard for two broadcast types
  const kb = new InlineKeyboard()
    .text("Event Participants", "bc_event")
    .text("Custom CSV", "bc_csv");

  await ctx.reply("Who do you want to broadcast to?", { reply_markup: kb });
});

/* -------------------------------------------------------------------------- */
/*          2) Handle inline buttons for "chooseTarget" step                 */
/* -------------------------------------------------------------------------- */
broadcastComposer.on("callback_query:data", async (ctx, next) => {
  if (ctx.session.broadcastStep !== "chooseTarget") {
    return next();
  }

  await ctx.answerCallbackQuery(); // Acknowledge button press
  const choice = ctx.callbackQuery.data;

  // If user chooses "Event Participants"
  if (choice === "bc_event") {
    ctx.session.broadcastType = "event";
    ctx.session.broadcastStep = "askEventUuid";
    await ctx.reply("Please send the Event UUID (36 characters).");
    return;
  }

  // If user chooses "Custom CSV"
  if (choice === "bc_csv") {
    ctx.session.broadcastType = "csv";
    ctx.session.broadcastStep = "askCsv";
    await ctx.reply("Please upload your CSV file now (one user_id per line).");
    return;
  }

  return next();
});

/* -------------------------------------------------------------------------- */
/*   3) Handle the next message: either an event UUID or a CSV document       */
/* -------------------------------------------------------------------------- */
broadcastComposer.on("message", async (ctx, next) => {
  // If user typed a new command, reset the flow
  if (isNewCommand(ctx)) {
    ctx.session = {};
    return next();
  }

  const step = ctx.session.broadcastStep;

  // "askEventUuid" => next text is the event ID
  if (step === "askEventUuid" && ctx.message?.text) {
    return handleEventUuid(ctx);
  }

  // "askCsv" => next doc is the CSV
  if (step === "askCsv" && ctx.message?.document) {
    return handleCsvUpload(ctx);
  }

  // "askBroadcast" => next message is the broadcast content
  if (step === "askBroadcast") {
    return handleBroadcastMessage(ctx);
  }

  return next();
});

/* -------------------------------------------------------------------------- */
/*                       Handle "askEventUuid" logic                          */

/* -------------------------------------------------------------------------- */
async function handleEventUuid(ctx: MyContext) {
  const uuidCandidate = ctx.message?.text?.trim();
  if (!uuidCandidate) return;

  // Quick length check
  if (uuidCandidate.length !== 36) {
    await ctx.reply("Event UUID must be 36 characters. Try again or /cancel.");
    return;
  }

  // Check if event exists
  const eventRow = await getEvent(uuidCandidate);
  if (!eventRow) {
    await ctx.reply("Event not found. Please check the UUID and try again.");
    return;
  }

  // Fetch participants
  const tickets = await getEventTickets(uuidCandidate);
  if (!tickets?.length) {
    await ctx.reply(
      `No participants found for event "${eventRow.title}". Nothing to broadcast.`,
    );
    // End flow
    ctx.session.broadcastStep = "done";
    return;
  }

  // Store them in session
  ctx.session.broadcastEventUuid = uuidCandidate;
  ctx.session.broadcastEventTitle = eventRow.title;
  ctx.session.broadcastUserIds = tickets.map((t) => String(t.user_id));

  // Next => askBroadcast
  ctx.session.broadcastStep = "askBroadcast";
  await ctx.reply(
    `✅ Event "${eventRow.title}" found with ${tickets.length} participant(s).\n` +
    "Now send any message (text, photo, video, etc.) you want to broadcast.",
  );
}

/* -------------------------------------------------------------------------- */
/*                         Handle "askCsv" logic                              */

/* -------------------------------------------------------------------------- */
async function handleCsvUpload(ctx: MyContext) {
  const doc = ctx.message?.document;
  if (!doc) {
    await ctx.reply("No file found in this message. Please upload a CSV.");
    return;
  }

  // Basic check for .csv file extension
  if (!doc.file_name?.endsWith(".csv")) {
    await ctx.reply("Please upload a file ending with .csv.");
    return;
  }

  // Retrieve file path from Telegram
  const fileInfo = await ctx.api.getFile(doc.file_id);
  if (!fileInfo.file_path) {
    await ctx.reply("Unable to retrieve file path from Telegram.");
    return;
  }

  const url = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${fileInfo.file_path}`;
  try {
    // Download & parse
    const res = await axios.get<ArrayBuffer>(url, { responseType: "arraybuffer" });
    const buffer = Buffer.from(res.data);

    // Each line => user_id
    const rows = parse(buffer.toString("utf-8"), { skip_empty_lines: true });
    const userIds: string[] = rows.map((r: string[]) => r[0]?.trim()).filter(Boolean);

    if (!userIds.length) {
      await ctx.reply("No user IDs found in the CSV. Flow canceled.");
      ctx.session.broadcastStep = "done";
      return;
    }

    // Save user IDs
    ctx.session.broadcastUserIds = userIds;

    // Next => "askBroadcast"
    ctx.session.broadcastStep = "askBroadcast";
    await ctx.reply(
      `✅ CSV parsed. Found ${userIds.length} user(s).\n` +
      "Now send any message (text, photo, video, etc.) you want to broadcast.",
    );
  } catch (err) {
    await ctx.reply(`Error parsing CSV: ${err}`);
    ctx.session.broadcastStep = "done";
  }
}

/* -------------------------------------------------------------------------- */
/*         4) "askBroadcast": next message gets copied to all user IDs        */

/* -------------------------------------------------------------------------- */
async function handleBroadcastMessage(ctx: MyContext) {
  // Grab the user IDs we have
  const userIds = ctx.session.broadcastUserIds;
  if (!userIds?.length) {
    await ctx.reply("No valid user IDs to broadcast. Flow ended.");
    ctx.session.broadcastStep = "done";
    return;
  }

  // We'll copy the EXACT message the admin just sent
  const sourceChatId = ctx.chat?.id;
  const sourceMessageId = ctx.message?.message_id;
  if (!sourceChatId || !sourceMessageId) {
    await ctx.reply("Unable to read the message ID or chat ID. Flow ended.");
    ctx.session.broadcastStep = "done";
    return;
  }

  // Start broadcasting
  await ctx.reply(`Broadcasting this message to ${userIds.length} users...`);

  let successCount = 0;
  for (let i = 0; i < userIds.length; i++) {
    const targetUserId = userIds[i];
    try {
      // Try up to 3 times, handle 429 with a 2-second pause
      await copyMessageWithRetries(ctx, targetUserId, sourceChatId, sourceMessageId);
      successCount++;
    } catch (error) {
      logger.warn(`Failed to send to user ${targetUserId} after retries: ${error}`);
    }

    // Small delay to reduce risk of immediate rate limit triggers
    await sleep(100);
  }

  await ctx.reply(`✅ Broadcast complete. Sent to ${successCount} user(s).`);
  // End flow
  ctx.session.broadcastStep = "done";
}
