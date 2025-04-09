import { Composer, InlineKeyboard } from "grammy";
import { MyContext } from "../types/MyContext";
import { isUserAdmin, getEvent, getEventTickets } from "../db/db";
import { isNewCommand } from "../helpers/isNewCommand";
import { parse } from "csv-parse/sync";
import axios from "axios";
import { sendMessageWithInfinityRetry } from "../helpers/sendMessageWithInfinityRetry";

export const broadcastComposer = new Composer<MyContext>();

/**
 * /broadcast command:
 * - Checks admin
 * - Sets step= "chooseType"
 * - Asks user: "Event participant or Custom CSV?"
 */
broadcastComposer.command("broadcast", async (ctx) => {
  // 1) Check admin
  const { isAdmin } = await isUserAdmin(ctx.from?.id.toString() || "");
  if (!isAdmin) return;

  // 2) Reset session & set step
  ctx.session.broadcastStep = "chooseType";
  ctx.session.broadcastType = undefined;
  ctx.session.broadcastEventUUID = undefined;
  ctx.session.broadcastCsvUserIds = [];
  ctx.session.broadcastMessage = undefined;

  // 3) Inline keyboard for the two choices
  const keyboard = new InlineKeyboard()
    .text("Event Participants", "bc_event")
    .text("Custom CSV", "bc_csv");

  await ctx.reply("Who do you want to broadcast to?", {
    reply_markup: keyboard,
  });
});

/* -------------------------------------------------------------------------- */
/*             1) Handle Inline Buttons for choosing broadcast type           */
/* -------------------------------------------------------------------------- */
broadcastComposer.on("callback_query:data", async (ctx, next) => {
  if (ctx.session.broadcastStep !== "chooseType") {
    return next();
  }
  const choice = ctx.callbackQuery.data;
  await ctx.answerCallbackQuery(); // acknowledges the click

  // If user chooses "Event Participants"
  if (choice === "bc_event") {
    ctx.session.broadcastType = "event";
    ctx.session.broadcastStep = "askEvent";
    await ctx.reply("Please send the Event UUID (36 characters).");
    return;
  }

  // If user chooses "Custom CSV"
  if (choice === "bc_csv") {
    ctx.session.broadcastType = "csv";
    ctx.session.broadcastStep = "askCsv";
    await ctx.reply("Please upload your CSV file now.");
    return;
  }
});

/* -------------------------------------------------------------------------- */
/*        2) Handle messages for askEvent (text) & askCsv (document)          */
/* -------------------------------------------------------------------------- */
broadcastComposer.on("message", async (ctx, next) => {
  // If user typed a new command, reset
  if (isNewCommand(ctx)) {
    ctx.session = {};
    return next();
  }

  const step = ctx.session.broadcastStep;

  // (A) If we are asking for Event UUID
  if (step === "askEvent" && ctx.message?.text) {
    return handleAskEvent(ctx);
  }

  // (B) If we are asking for CSV
  if (step === "askCsv" && ctx.message?.document) {
    return handleAskCsv(ctx);
  }

  // If any other message in these steps => do nothing or next
  return next();
});

/* -------------------------------------------------------------------------- */
/*             3) After we have event or CSV, we ask for broadcast msg        */
/* -------------------------------------------------------------------------- */
broadcastComposer.on("message:text", async (ctx, next) => {
  const step = ctx.session.broadcastStep;
  if (!step || step === "done") {
    return next();
  }

  // If we finished collecting event or CSV and are now ready for a message
  if (step === "askMessage") {
    return handleBroadcastMessage(ctx);
  }

  return next();
});

/* -------------------------------------------------------------------------- */
/*                      Handler Functions                                     */
/* -------------------------------------------------------------------------- */

// Handle "askEvent": validate event, then proceed to ask for broadcast message
async function handleAskEvent(ctx: MyContext) {
  const text = ctx.message?.text?.trim();
  if (!text) return;

  // Basic check for 36-char
  if (text.length !== 36) {
    await ctx.reply("Event UUID must be 36 characters. Try again or /cancel.");
    return;
  }

  // Validate from DB
  const eventRow = await getEvent(text);
  if (!eventRow) {
    await ctx.reply("Event not found. Please check the UUID and try again.");
    return;
  }

  // Store event
  ctx.session.broadcastEventUUID = text;
  ctx.session.broadcastStep = "askMessage";

  await ctx.reply(
    `✅ Event found: "${eventRow.title}".\nNow send the broadcast message.`,
  );
}

// Handle "askCsv": parse CSV, then proceed to ask for broadcast message
async function handleAskCsv(ctx: MyContext) {
  const document = ctx.message?.document;
  if (!document) {
    await ctx.reply("Please upload a valid CSV file.");
    return;
  }

  // Basic check for .csv
  if (!document.file_name?.endsWith(".csv")) {
    await ctx.reply("Please upload a file ending with .csv");
    return;
  }

  // Get file from Telegram
  const fileInfo = await ctx.api.getFile(document.file_id);
  if (!fileInfo.file_path) {
    await ctx.reply("Could not retrieve file path from Telegram.");
    return;
  }
  const fileUrl = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${fileInfo.file_path}`;

  // Download & parse
  try {
    const res = await axios.get<ArrayBuffer>(fileUrl, {
      responseType: "arraybuffer",
    });
    const buffer = Buffer.from(res.data);

    // Parse CSV
    const rows = parse(buffer.toString("utf-8"), {
      skip_empty_lines: true,
    });

    // Suppose the CSV is just lines of user IDs
    const userIds: string[] = rows.map((row: string[]) => row[0]?.trim());

    if (!userIds.length) {
      await ctx.reply("No user IDs found in the CSV.");
      return;
    }

    // Store them in session
    ctx.session.broadcastCsvUserIds = userIds;

    // Next => askMessage
    ctx.session.broadcastStep = "askMessage";
    await ctx.reply(`✅ Found ${userIds.length} user IDs. Now send the message.`);
  } catch (err) {
    await ctx.reply(`Error parsing CSV: ${err}`);
  }
}

// Handle "askMessage": we already have either event or CSV => broadcast
async function handleBroadcastMessage(ctx: MyContext) {
  const text = ctx.message?.text?.trim();
  if (!text) return;

  ctx.session.broadcastMessage = text;

  // Send the message depending on broadcastType
  if (ctx.session.broadcastType === "event") {
    await sendToEventParticipants(ctx);
  } else {
    await sendToCsvUsers(ctx);
  }

  // Mark flow done
  ctx.session.broadcastStep = "done";
  ctx.session.broadcastType = undefined;
  ctx.session.broadcastEventUUID = undefined;
  ctx.session.broadcastCsvUserIds = [];
  ctx.session.broadcastMessage = undefined;
}

/* -------------------------------------------------------------------------- */
/*                      Actual Broadcast Logic                                */
/* -------------------------------------------------------------------------- */

// 1) If user chose "Event Participants"
async function sendToEventParticipants(ctx: MyContext) {
  const eventId = ctx.session.broadcastEventUUID;
  const message = ctx.session.broadcastMessage;
  if (!eventId || !message) {
    await ctx.reply("Missing eventId or message. Nothing sent.");
    return;
  }

  // Query DB for participants
  const tickets = await getEventTickets(eventId);
  if (!tickets?.length) {
    await ctx.reply("No participants found for that event.");
    return;
  }

  await ctx.reply(`Sending message to ${tickets.length} participants...`);

  let count = 0;
  for (const ticket of tickets) {
    try {
      await sendMessageWithInfinityRetry(ticket.user_id, message, ctx);
      count++;
    } catch {
      // You can log errors if you want
    }
  }

  await ctx.reply(`✅ Message sent to ${count} participants (event).`);
}

// 2) If user chose "Custom CSV"
async function sendToCsvUsers(ctx: MyContext) {
  const userIds = ctx.session.broadcastCsvUserIds || [];
  const message = ctx.session.broadcastMessage;
  if (!userIds.length || !message) {
    await ctx.reply("CSV user IDs or message missing. Nothing sent.");
    return;
  }

  await ctx.reply(`Sending message to ${userIds.length} users from CSV...`);

  let count = 0;
  for (const uid of userIds) {
    try {
      await sendMessageWithInfinityRetry(uid, message, ctx);
      count++;
    } catch {
      // You can log errors if you want
    }
  }

  await ctx.reply(`✅ Message sent to ${count} users (CSV).`);
}
