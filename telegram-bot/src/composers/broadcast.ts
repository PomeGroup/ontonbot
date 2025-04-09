import { Composer, InlineKeyboard, InputFile } from "grammy";
import { MyContext } from "../types/MyContext";
import { isUserAdmin, getEvent, getEventTickets } from "../db/db";
import { parse } from "csv-parse/sync";
import axios from "axios";
import { isNewCommand } from "../helpers/isNewCommand";
import { logger } from "../utils/logger";
import { sleep } from "../utils/utils";
import { additionalRecipients } from "../constants"; // or wherever you store them
import { Readable } from "stream";

export const broadcastComposer = new Composer<MyContext>();

/* -------------------------------------------------------------------------- */
/*                               /broadcast                                   */
/* -------------------------------------------------------------------------- */
broadcastComposer.command("broadcast", async (ctx) => {
  const { isAdmin } = await isUserAdmin(ctx.from?.id.toString() || "");
  if (!isAdmin) return;

  // Reset session
  ctx.session.broadcastStep = "chooseTarget";
  ctx.session.broadcastType = undefined;
  ctx.session.broadcastEventUuid = undefined;
  ctx.session.broadcastEventTitle = undefined;
  ctx.session.broadcastUserIds = [];
  ctx.session.broadcastCsvUserIds = [];

  // Inline keyboard
  const kb = new InlineKeyboard()
    .text("Event Participants", "bc_event")
    .text("Custom CSV", "bc_csv");

  await ctx.reply("Who do you want to broadcast to?", { reply_markup: kb });
});

/* -------------------------------------------------------------------------- */
/*          1) "chooseTarget" => handle inline buttons                       */
/* -------------------------------------------------------------------------- */
broadcastComposer.on("callback_query:data", async (ctx, next) => {
  if (ctx.session.broadcastStep !== "chooseTarget") {
    return next();
  }
  await ctx.answerCallbackQuery();

  const choice = ctx.callbackQuery.data;
  if (choice === "bc_event") {
    ctx.session.broadcastType = "event";
    ctx.session.broadcastStep = "askEventUuid";
    await ctx.reply("Please send the Event UUID (36 characters).");
    return;
  }

  if (choice === "bc_csv") {
    ctx.session.broadcastType = "csv";
    ctx.session.broadcastStep = "askCsv";
    await ctx.reply("Please upload your CSV file now (one user_id per line).");
    return;
  }
});

/* -------------------------------------------------------------------------- */
/*        2) Next message => either event UUID or CSV document               */
/* -------------------------------------------------------------------------- */
broadcastComposer.on("message", async (ctx, next) => {
  if (isNewCommand(ctx)) {
    ctx.session = {};
    return next();
  }

  const step = ctx.session.broadcastStep;

  if (step === "askEventUuid" && ctx.message?.text) {
    return handleEventUuid(ctx);
  }

  if (step === "askCsv" && ctx.message?.document) {
    return handleCsvUpload(ctx);
  }

  // step=askBroadcast => next message is the broadcast content
  if (step === "askBroadcast") {
    return handleBroadcastMessage(ctx);
  }

  return next();
});

/* -------------------------------------------------------------------------- */
/*                     handleEventUuid => fetch participants                  */

/* -------------------------------------------------------------------------- */
async function handleEventUuid(ctx: MyContext) {
  const uuidCandidate = ctx.message?.text?.trim();
  if (!uuidCandidate) return;

  if (uuidCandidate.length !== 36) {
    await ctx.reply("Event UUID must be 36 characters. Try again or /cancel.");
    return;
  }

  const eventRow = await getEvent(uuidCandidate);
  if (!eventRow) {
    await ctx.reply("Event not found. Check the UUID and try again.");
    return;
  }

  const tickets = await getEventTickets(uuidCandidate);
  if (!tickets?.length) {
    await ctx.reply(
      `No participants found for event "${eventRow.title}". Nothing to broadcast.`,
    );
    ctx.session.broadcastStep = "done";
    return;
  }

  ctx.session.broadcastEventUuid = uuidCandidate;
  ctx.session.broadcastEventTitle = eventRow.title;
  ctx.session.broadcastUserIds = tickets.map((t) => String(t.user_id));

  ctx.session.broadcastStep = "askBroadcast";
  await ctx.reply(
    `✅ Event "${eventRow.title}" found with ${tickets.length} participant(s).\n` +
    "Now send any message (text, photo, video, etc.) you want to broadcast.",
  );
}

/* -------------------------------------------------------------------------- */
/*                handleCsvUpload => parse CSV into user IDs                 */

/* -------------------------------------------------------------------------- */
async function handleCsvUpload(ctx: MyContext) {
  const doc = ctx.message?.document;
  if (!doc) {
    await ctx.reply("No file found. Please upload a CSV.");
    return;
  }
  if (!doc.file_name?.endsWith(".csv")) {
    await ctx.reply("Please upload a file ending with .csv.");
    return;
  }

  const fileInfo = await ctx.api.getFile(doc.file_id);
  if (!fileInfo.file_path) {
    await ctx.reply("Unable to retrieve file path from Telegram.");
    return;
  }

  const url = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${fileInfo.file_path}`;
  try {
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

    ctx.session.broadcastUserIds = userIds;
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
/*        3) askBroadcast => next message is broadcast to all user IDs       */

/* -------------------------------------------------------------------------- */
async function handleBroadcastMessage(ctx: MyContext) {
  const userIds = ctx.session.broadcastUserIds;
  if (!userIds?.length) {
    await ctx.reply("No valid user IDs to broadcast. Flow ended.");
    ctx.session.broadcastStep = "done";
    return;
  }

  const sourceChatId = ctx.chat?.id;
  const sourceMessageId = ctx.message?.message_id;
  if (!sourceChatId || !sourceMessageId) {
    await ctx.reply("Unable to read the message ID or chat ID. Flow ended.");
    ctx.session.broadcastStep = "done";
    return;
  }

  await ctx.reply(`Broadcasting this message to ${userIds.length} users...`);

  // We'll store any errors here
  const errors: { user_id: string; error: string }[] = [];
  let successCount = 0;

  // Broadcast loop
  for (let i = 0; i < userIds.length; i++) {
    const targetUserId = userIds[i];
    try {
      // copyMessage => replicate the same content
      await ctx.api.copyMessage(targetUserId, sourceChatId, sourceMessageId);
      successCount++;
    } catch (error: any) {
      logger.warn(`Failed to send to user ${targetUserId}: ${error}`);
      // Store the error row
      errors.push({ user_id: targetUserId, error: String(error) });
    }
    // Sleep a bit to avoid rate limit
    await sleep(100);
  }

  // 1) Basic summary
  await ctx.reply(`✅ Broadcast complete. Sent to ${successCount} user(s).`);

  // 2) Check if we have any errors
  if (errors.length === 0) {
    await ctx.reply("No errors occurred during the broadcast!");
    // But we still need to notify additional admins, so let's do that
    await notifyAdmins(ctx, sourceChatId, sourceMessageId, null, successCount);
  } else {
    // We have some errors => build a CSV with: user_id,error
    const header = "user_id,error";
    const csvRows = errors.map((e) => `${e.user_id},${escapeCsv(e.error)}`);
    const finalCsvString = [header, ...csvRows].join("\n");

    // Convert to InputFile
    const fileName = "broadcast_errors.csv";
    const fileStream = Readable.from(finalCsvString);
    const inputFile = new InputFile(fileStream, fileName);

    // Send CSV to the current user
    const messageWithDoc = await ctx.replyWithDocument(inputFile, {
      caption:
        `There were ${errors.length} errors. See details in the CSV.`,
    });

    // Also notify additional admins (with the same CSV attached)
    await notifyAdmins(ctx, sourceChatId, sourceMessageId, messageWithDoc.document?.file_id, successCount);
  }

  // End flow
  ctx.session.broadcastStep = "done";
}

/* -------------------------------------------------------------------------- */
/*             Helper: notifyAdmins => forward broadcast + errors            */

/* -------------------------------------------------------------------------- */
async function notifyAdmins(
  ctx: MyContext,
  broadcastSourceChatId: number,
  broadcastSourceMsgId: number,
  errorCsvFileId: string | undefined | null,
  successCount: number,
) {
  const fromAdminId = ctx.from?.id;
  const textSummary = `Broadcast summary:\n- Success count: ${successCount}\n`;

  for (const adminId of additionalRecipients) {
    try {
      // 1) Copy the broadcast message to each admin
      await ctx.api.copyMessage(adminId, broadcastSourceChatId, broadcastSourceMsgId, {
        caption: "This was the broadcasted message.",
      });
    } catch (err) {
      logger.warn(`Could not forward broadcast message to admin ${adminId}: ${err}`);
    }

    // 2) Send a text summary
    try {
      await ctx.api.sendMessage(adminId, textSummary);
    } catch (err) {
      logger.warn(`Could not send summary to admin ${adminId}: ${err}`);
    }

    // 3) If we have an error CSV, send it
    if (errorCsvFileId) {
      try {
        await ctx.api.sendDocument(adminId, errorCsvFileId, {
          caption: `Broadcast encountered some errors. See CSV.`,
        });
      } catch (err) {
        logger.warn(`Could not send CSV to admin ${adminId}: ${err}`);
      }
    }
  }
}

/* -------------------------------------------------------------------------- */
/*     Utility to escape CSV fields that might contain commas/newlines       */

/* -------------------------------------------------------------------------- */
function escapeCsv(str: string): string {
  // Very simple approach: enclose in quotes if it contains a comma/quote
  if (!str) return "";
  let s = str.replace(/"/g, "\"\"");
  if (/[,"]/.test(s)) {
    s = `"${s}"`;
  }
  return s;
}
