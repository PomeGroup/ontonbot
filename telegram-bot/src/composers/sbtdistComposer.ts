import { Composer, InlineKeyboard, InputFile } from "grammy";
import { MyContext } from "../types/MyContext";
import {
  getApprovedRegistrants,
  getEvent,
  processCsvLinesForSbtDist,
} from "../db/db";
import { Readable } from "stream";
import axios from "axios";
import { additionalRecipients } from "../constants";
import { logger } from "../utils/logger";
import { isNewCommand } from "../helpers/isNewCommand";
import { sleep } from "../utils/utils";

export const sbtdistComposer = new Composer<MyContext>();

/**
 * /sbtdist command:
 * - Initialize the session flow
 * - Prompt user to send the Event UUID
 */
sbtdistComposer.command("sbtdist", async (ctx) => {
  // Reset any previous data
  ctx.session.sbtdistStep = "askEventUUID";
  ctx.session.sbtEventUUID = undefined;
  ctx.session.sbtEventTitle = undefined;

  await ctx.reply(
    "Please send the Event UUID (36 characters). Type /cancel to abort.",
  );
});

/**
 *  Handle text messages based on current sbtdistStep
 */
sbtdistComposer.on("message:text", async (ctx, next) => {
  // If user typed a new command, reset session & go next
  if (isNewCommand(ctx)) {
    ctx.session = {};
    return next();
  }

  const step = ctx.session.sbtdistStep;
  if (!step || step === "done") {
    return next();
  }

  if (step === "askEventUUID") {
    return handleAskEventUUID(ctx);
  }

  // If user types text in any other step that expects a callback (like "confirmEventSelection"),
  // we can choose to ignore or prompt them. We'll just ignore here.
  return next();
});

/**
 *  Handle document messages (CSV) only if step=askCsvFile
 */
sbtdistComposer.on("message:document", async (ctx, next) => {
  // Only proceed if we are in the CSV upload step
  if (ctx.session.sbtdistStep !== "askCsvFile") {
    return next();
  }
  if (isNewCommand(ctx)) {
    ctx.session = {};
    return next();
  }

  await handleCsvFile(ctx);
});

/**
 *  Handle inline button presses
 */
sbtdistComposer.on("callback_query:data", async (ctx, next) => {
  const step = ctx.session.sbtdistStep;
  if (!step || step === "done") {
    return next();
  }

  const data = ctx.callbackQuery.data;

  // Step 2: confirmEventSelection
  if (step === "confirmEventSelection") {
    if (data === "confirmEventDist") {
      await ctx.answerCallbackQuery();
      ctx.session.sbtdistStep = "chooseDistributionMethod";
      return showDistributionMethodMenu(ctx);
    } else if (data === "cancelEventDist") {
      await ctx.answerCallbackQuery();
      await cancelFlow(ctx, "Event selection canceled. Type /sbtdist to start over.");
    }
    return;
  }

  // Step 3: chooseDistributionMethod
  if (step === "chooseDistributionMethod") {
    if (data === "chooseCsv") {
      await ctx.answerCallbackQuery();
      ctx.session.sbtdistStep = "askCsvFile";
      await ctx.reply(
        `Please upload the CSV file for the event "${ctx.session.sbtEventTitle}".`,
      );
    } else if (data === "chooseAllApproved") {
      await ctx.answerCallbackQuery();
      ctx.session.sbtdistStep = "handleAllApproved";
      await handleAllApproved(ctx);
    } else {
      await ctx.answerCallbackQuery();
      await ctx.reply("Unknown choice. Please try again.");
    }
    return;
  }

  // If no match, pass to next
  return next();
});

/* -------------------------------------------------------------------------- */
/*                           Handler Functions                                */

/* -------------------------------------------------------------------------- */

/**
 * STEP 1: handleAskEventUUID
 * - Validate user input is 36 chars
 * - Check if event exists
 * - If valid => step=confirmEventSelection => show inline keyboard
 */
async function handleAskEventUUID(ctx: MyContext) {
  const text = ctx.message?.text?.trim();
  if (!text) return;

  if (text.length !== 36) {
    await ctx.reply(
      "Invalid Event UUID. Must be 36 characters. Try again or /cancel.",
    );
    return;
  }

  const eventRow = await getEvent(text);
  if (!eventRow) {
    await ctx.reply("Event not found. Please check the UUID and try again.");
    return;
  }

  // Store info in session
  ctx.session.sbtEventUUID = text;
  ctx.session.sbtEventTitle = eventRow.title;
  ctx.session.sbtdistStep = "confirmEventSelection";

  // Inline keyboard for confirm or cancel
  const keyboard = new InlineKeyboard()
    .text("✅ Confirm", "confirmEventDist")
    .text("❌ Cancel", "cancelEventDist");

  await ctx.reply(
    `Are you sure you want to send rewards for event "${eventRow.title}"?`,
    { reply_markup: keyboard },
  );
}

/**
 * STEP 2 -> 3: showDistributionMethodMenu
 * - Called after user confirms the event
 */
async function showDistributionMethodMenu(ctx: MyContext) {
  // Provide inline buttons for CSV or ALL APPROVED
  const keyboard = new InlineKeyboard()
    .text("CSV", "chooseCsv")
    .text("ALL Approved Guests", "chooseAllApproved");

  await ctx.reply(
    `How do you want to distribute?\n- "CSV": Upload a CSV of user IDs\n` +
    `- "ALL Approved Guests": Create rewards for all approved registrants`,
    { reply_markup: keyboard },
  );
}

/**
 * STEP 4: handleCsvFile
 * - We are in step=askCsvFile => user uploads CSV
 * - Validate, parse, upsert data, return summary CSV
 * - Then step=done
 */
async function handleCsvFile(ctx: MyContext) {
  // Basic checks
  const document = ctx.message.document;
  if (!document) {
    await ctx.reply("No file found in this message. Please upload a CSV.");
    return;
  }
  if (!document.file_name?.endsWith(".csv")) {
    await ctx.reply("Please upload a .csv file.");
    return;
  }

  // Retrieve the file from Telegram
  const fileInfo = await ctx.api.getFile(document.file_id);
  if (!fileInfo.file_path) {
    await ctx.reply("Unable to retrieve file path from Telegram.");
    return;
  }

  const fileUrl = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${fileInfo.file_path}`;

  try {
    const axiosRes = await axios.get<ArrayBuffer>(fileUrl, {
      responseType: "arraybuffer",
    });
    const fileBuffer = Buffer.from(axiosRes.data);

    // Parse CSV
    const fileContent = fileBuffer.toString("utf-8");
    const lines = fileContent.trim().split("\n");
    const eventUUIDInFile = lines[0]?.trim();
    const eventUUIDInSession = ctx.session.sbtEventUUID;

    if (!eventUUIDInSession) {
      await cancelFlow(ctx, "No valid event UUID in session. Please start over with /sbtdist.");
      return;
    }
    if (eventUUIDInFile !== eventUUIDInSession) {
      await ctx.reply(
        `The first line of the CSV must match the event UUID (${eventUUIDInSession}).\n` +
        `Found: "${eventUUIDInFile}". Please re-check your file.`,
      );
      return;
    }

    // Process user IDs
    const userIdLines = lines.slice(1);
    const results = await processCsvLinesForSbtDist(eventUUIDInSession, userIdLines);

    // Build the result CSV
    const header = "user_id,user_name,process_result";
    const csvRows = results.map(
      (r) => `${r.userId},${r.user_name},${r.process_result}`,
    );
    const finalCsvString = [header, ...csvRows].join("\n");

    // Prepare to send back
    const eventTitle = ctx.session.sbtEventTitle || "untitled_event";
    const sanitizedEventTitle = eventTitle
      .toLowerCase()
      .replace(/[^\w]+/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "");
    const finalFileName = `sbt-dist-${sanitizedEventTitle || "no_title"}.csv`;

    const fileStream = Readable.from(finalCsvString);
    const inputFile = new InputFile(fileStream, finalFileName);

    const uploaderUsername = ctx.from?.username
      ? `@${ctx.from.username}`
      : ctx.from?.first_name || String(ctx.from?.id) || "Unknown";

    // Send document to the uploader
    const message = await ctx.replyWithDocument(inputFile, {
      caption:
        `CSV processed for "${eventTitle}"!\n` +
        `Total rows processed: ${results.length}\n` +
        `Distributed by: ${uploaderUsername}`,
    });

    // Forward to additional recipients
    const fileId = message.document?.file_id;
    if (fileId) {
      for (const recipientId of additionalRecipients) {
        if (ctx.from?.id !== recipientId) {
          await ctx.api.sendDocument(recipientId, fileId, {
            caption:
              `CSV processed for "${eventTitle}"!\n` +
              `Total rows processed: ${results.length}\n` +
              `Distributed by: ${uploaderUsername}`,
          });
        }
      }
    }
  } catch (error) {
    await ctx.reply(`Error processing CSV file: ${error}`);
    return;
  }

  // Done
  ctx.session.sbtdistStep = "done";
  ctx.session.sbtEventUUID = undefined;
  ctx.session.sbtEventTitle = undefined;
}

/**
 * handleAllApproved => step=handleAllApproved
 * - Distributes to all "approved" registrants
 * - Creates summary CSV
 * - Then step=done
 */
async function handleAllApproved(ctx: MyContext) {
  try {
    const eventUUID = ctx.session.sbtEventUUID;
    const eventTitle = ctx.session.sbtEventTitle || "untitled_event";

    if (!eventUUID) {
      await cancelFlow(ctx, "No valid event UUID in session. Please start over with /sbtdist.");
      return;
    }

    // 1) fetch approved registrants
    const approvedRegistrants = await getApprovedRegistrants(eventUUID);
    if (!approvedRegistrants.length) {
      await ctx.reply(`No approved registrants found for event ${eventUUID}.`);
      return cancelFlow(ctx);
    }

    // 2) user IDs
    const userIdLines = approvedRegistrants.map((row) => String(row.user_id));

    // 3) upsert logic
    const results = await processCsvLinesForSbtDist(eventUUID, userIdLines);

    // 4) build CSV
    const header = "user_id,user_name,process_result";
    const csvRows = results.map(
      (r) => `${r.userId},${r.user_name},${r.process_result}`,
    );
    const finalCsvString = [header, ...csvRows].join("\n");

    // 5) file name
    const sanitizedEventTitle = eventTitle
      .toLowerCase()
      .replace(/[^\w]+/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "");
    const finalFileName = `sbt-dist-approved-${sanitizedEventTitle || "no_title"}.csv`;

    // 6) convert to InputFile
    const fileStream = Readable.from(finalCsvString);
    const inputFile = new InputFile(fileStream, finalFileName);

    // 7) Uploader name
    const uploaderUsername = ctx.from?.username
      ? `@${ctx.from.username}`
      : ctx.from?.first_name || String(ctx.from?.id) || "Unknown";

    // 8) send doc to current user
    const message = await ctx.replyWithDocument(inputFile, {
      caption:
        `Rewards created for all approved registrants of "${eventTitle}".\n` +
        `Total rows processed: ${results.length}\n` +
        `Distributed by: ${uploaderUsername}`,
    });

    // 9) forward to recipients
    const fileId = message.document?.file_id;
    if (fileId) {
      for (const recipientId of additionalRecipients) {
        if (recipientId !== ctx.from?.id) {
          await ctx.api.sendDocument(recipientId, fileId, {
            caption:
              `Rewards created for all approved registrants of "${eventTitle}".\n` +
              `Total rows processed: ${results.length}\n` +
              `Distributed by: ${uploaderUsername}`,
          });
        }
      }
    }
  } catch (err) {
    await ctx.reply(`Error creating rewards for all approved: ${err}`);
  }

  // Done
  ctx.session.sbtdistStep = "done";
  ctx.session.sbtEventUUID = undefined;
  ctx.session.sbtEventTitle = undefined;
}

/* -------------------------------------------------------------------------- */
/*                           Utility Helpers                                  */

/* -------------------------------------------------------------------------- */

/**
 * Cancel flow with an optional message
 */
async function cancelFlow(ctx: MyContext, msg?: string) {
  if (msg) await ctx.reply(msg);
  ctx.session.sbtdistStep = "done";
  ctx.session.sbtEventUUID = undefined;
  ctx.session.sbtEventTitle = undefined;
}
