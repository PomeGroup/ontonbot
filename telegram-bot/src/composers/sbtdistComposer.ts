import { Composer, InputFile, Keyboard } from "grammy";
import { MyContext } from "../types/MyContext";
import { getApprovedRegistrants, getEvent, processCsvLinesForSbtDist } from "../db/db";
import { Readable } from "stream";
import axios from "axios";

const additionalRecipients = [
  748891997, // samyar_kd
  185027333, // sid_hazrati
  23932283, // Mfarimani
  7013087032, // Ontonadmin
  91896720, //elbabix
  548648769, // Radiophp
];
export const sbtdistComposer = new Composer<MyContext>();
/**
 * STEP 1: askEventUUID
 * - Validate user input as a 36-char UUID
 * - Check DB if it exists
 * - Prompt user for "Are you sure...?" using a reply keyboard
 */
/**
 * STEP 1: askEventUUID
 */
sbtdistComposer.on("message:text", async (ctx, next) => {
  if (ctx.session.sbtdistStep === "askEventUUID") {
    const text = ctx.message.text.trim();
    if (text.length !== 36) {
      await ctx.reply("Invalid Event UUID. Must be 36 characters. Try again or /cancel.");
      return;
    }
    const eventRow = await getEvent(text);
    if (!eventRow) {
      await ctx.reply("Event not found. Please check the UUID and try again.");
      return;
    }
    ctx.session.sbtEventUUID = text;
    ctx.session.sbtEventTitle = eventRow.title;
    ctx.session.sbtdistStep = "confirmEventSelection";

    const kb = new Keyboard().text("Yes").text("No").row();
    await ctx.reply(
      `Are you sure you want to send rewards for event "${eventRow.title}"?\n` +
      `Tap "Yes" or "No" below.`,
      {
        reply_markup: {
          keyboard: kb.build(),
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      },
    );
    return;
  }

  /**
   * STEP 2: confirmEventSelection
   */
  if (ctx.session.sbtdistStep === "confirmEventSelection") {
    const text = ctx.message.text.trim().toLowerCase();
    if (text === "yes") {
      // Move to method selection
      ctx.session.sbtdistStep = "chooseDistributionMethod";

      const kb = new Keyboard().text("CSV").text("ALL APPROVED GUESTS").row();
      await ctx.reply(
        `Choose your distribution method:\n` +
        `- "CSV": Upload a CSV of user IDs\n` +
        `- "ALL APPROVED GUEST": Create rewards for all approved registrants`,
        {
          reply_markup: {
            keyboard: kb.build(),
            resize_keyboard: true,
            one_time_keyboard: true,
          },
        },
      );
      return;
    }
    if (text === "no") {
      ctx.session.sbtdistStep = undefined;
      ctx.session.sbtEventUUID = undefined;
      ctx.session.sbtEventTitle = undefined;
      await ctx.reply("Cancelled. Type /sbtdist to try again.");
      return;
    }
    await ctx.reply("Please reply with \"Yes\" or \"No\".");
    return;
  }

  /**
   * STEP 3: chooseDistributionMethod
   */
  if (ctx.session.sbtdistStep === "chooseDistributionMethod") {
    const text = ctx.message.text.trim().toLowerCase();
    console.log("chooseDistributionMethod", text);
    if (text === "csv") {
      // The original flow
      ctx.session.sbtdistStep = "askCsvFile";
      await ctx.reply(
        `Alright! Please upload the CSV file for event "${ctx.session.sbtEventTitle}".`,
      );
      return;
    } else if (text === "all approved guests") {
      // Immediately fetch all approved and handle
      ctx.session.sbtdistStep = "handleAllApproved";

      // We'll call a helper function to handle "ALL" logic
      await handleAllApproved(ctx);
      return;
    } else {
      await ctx.reply("Please reply with \"CSV\" or \"ALL Approved Guests\".");
      return;
    }
  }

  // If no match, pass to next
  return next();
});

sbtdistComposer.on("message:document", async (ctx, next) => {
  if (ctx.session.sbtdistStep !== "askCsvFile") {
    return next();
  }

  // 1) Basic checks
  const document = ctx.message.document;
  if (!document) {
    await ctx.reply("No file found in this message. Please upload a CSV.");
    return;
  }
  if (!document.file_name?.endsWith(".csv")) {
    await ctx.reply("Please upload a .csv file.");
    return;
  }

  // 2) Retrieve the file info from Telegram
  const fileInfo = await ctx.api.getFile(document.file_id);
  if (!fileInfo.file_path) {
    await ctx.reply("Unable to retrieve file path from Telegram.");
    return;
  }

  // 3) Construct the download URL
  const fileUrl = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${fileInfo.file_path}`;

  try {
    // 4) Download the file
    const axiosRes = await axios.get<ArrayBuffer>(fileUrl, { responseType: "arraybuffer" });
    const fileBuffer = Buffer.from(axiosRes.data);

    // 5) Parse the CSV
    const fileContent = fileBuffer.toString("utf-8");
    const lines = fileContent.trim().split("\n");
    const eventUUIDInFile = lines[0]?.trim();

    // 6) Check event UUID
    const eventUUIDInSession = ctx.session.sbtEventUUID;
    if (!eventUUIDInSession) {
      await ctx.reply("No valid event UUID in session. Please start over with /sbtdist.");
      return;
    }
    if (eventUUIDInFile !== eventUUIDInSession) {
      await ctx.reply(
        `The first line of the CSV must match the event UUID (${eventUUIDInSession}).\n` +
        `Found: "${eventUUIDInFile}". Please re-check your file.`,
      );
      return;
    }

    // 7) Process user IDs (lines[1..])
    const userIdLines = lines.slice(1);
    const results = await processCsvLinesForSbtDist(eventUUIDInSession, userIdLines);

    // 8) Build the result CSV
    const header = "user_id,user_name,process_result";
    const csvRows = results.map(r => `${r.userId},${r.user_name},${r.process_result}`);
    const finalCsvString = [header, ...csvRows].join("\n");

    // 9) Prepare to send back

    const eventTitle = ctx.session.sbtEventTitle || "untitled_event";
    // e.g. "Event Name 2025" -> "event_name_2025"
    const sanitizedEventTitle = eventTitle
      .toLowerCase()
      .replace(/[^\w]+/g, "_") // replace non-alphanumeric with underscores
      .replace(/_+/g, "_")     // compress multiple underscores
      .replace(/^_+|_+$/g, ""); // remove leading/trailing underscores

    // Example final name: sbt-dist-event_name_2025.csv
    const finalFileName = `sbt-dist-${sanitizedEventTitle || "no_title"}.csv`;

    const fileStream = Readable.from(finalCsvString);
    const inputFile = new InputFile(fileStream, finalFileName);

    // Grab the uploader’s username, or a fallback
    const uploaderUsername = ctx.from?.username
      ? `@${ctx.from.username}`
      : (ctx.from?.first_name || ctx.from?.id || "Unknown");

    // 10) Send document to the uploader
    const message = await ctx.replyWithDocument(inputFile, {
      caption:
        `CSV processed successfully for "${ctx.session.sbtEventTitle}"!\n` +
        `Total rows processed: ${results.length}\n` +
        `Distributed by: ${uploaderUsername}`,
    });

    // 11) Reuse file_id to forward to additional recipients
    const fileId = message.document?.file_id;
    if (!fileId) {
      console.error("Could not get file_id from Telegram!");
      return;
    }


    for (const recipientId of additionalRecipients) {
      if (ctx.from?.id !== recipientId) {
        await ctx.api.sendDocument(recipientId, fileId, {
          caption:
            `CSV processed successfully for "${ctx.session.sbtEventTitle}"!\n` +
            `Total rows processed: ${results.length}\n` +
            `Distributed by: ${uploaderUsername}`,
        });
      }
    }

  } catch (error) {
    await ctx.reply(`Error processing CSV file: ${error}`);
    return;
  }

  // 12) Reset the flow
  ctx.session.sbtdistStep = "done";
  ctx.session.sbtEventUUID = undefined;
  ctx.session.sbtEventTitle = undefined;
});

/**
 * STEP 5: handleAllApproved => fetch all 'approved' registrants
 * Create rewards, produce a summary CSV, send to user, forward to additional recipients
 */
async function handleAllApproved(ctx: MyContext) {
  try {
    const eventUUID = ctx.session.sbtEventUUID;
    if (!eventUUID) {
      await ctx.reply("No valid event UUID in session. Please start over with /sbtdist.");
      // reset everything
      ctx.session.sbtdistStep = undefined;
      return;
    }

    // 1) fetch approved registrants
    // you can define `getApprovedRegistrants(eventUUID)` in your DB code
    const approvedRegistrants = await getApprovedRegistrants(eventUUID);
    if (!approvedRegistrants.length) {
      await ctx.reply(`No approved registrants found for event ${eventUUID}.`);
      // end flow
      ctx.session.sbtdistStep = undefined;
      ctx.session.sbtEventUUID = undefined;
      ctx.session.sbtEventTitle = undefined;
      return;
    }

    // 2) Create an array of user IDs from the rows
    const userIdLines = approvedRegistrants.map((row) => String(row.user_id));

    // 3) Pass to processCsvLinesForSbtDist
    // re-use the same logic that upserts visitors + rewards
    const results = await processCsvLinesForSbtDist(eventUUID, userIdLines);

    // 4) Build the result CSV
    const header = "user_id,user_name,process_result";
    const csvRows = results.map(
      (r) => `${r.userId},${r.user_name},${r.process_result}`,
    );
    const finalCsvString = [header, ...csvRows].join("\n");

    // 5) Prepare a file name
    const eventTitle = ctx.session.sbtEventTitle || "untitled_event";
    const sanitizedEventTitle = eventTitle
      .toLowerCase()
      .replace(/[^\w]+/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "");
    const finalFileName = `sbt-dist-approved-${sanitizedEventTitle || "no_title"}.csv`;

    // 6) Convert CSV string to an InputFile
    const fileStream = Readable.from(finalCsvString);
    const inputFile = new InputFile(fileStream, finalFileName);

    // 7) Uploader's name
    const uploaderUsername = ctx.from?.username
      ? `@${ctx.from.username}`
      : ctx.from?.first_name || String(ctx.from?.id) || "Unknown";

    // 8) Send doc to the current user
    const message = await ctx.replyWithDocument(inputFile, {
      caption:
        `Rewards created for all approved registrants of "${ctx.session.sbtEventTitle}".\n` +
        `Total rows processed: ${results.length}\n` +
        `Distributed by: ${uploaderUsername}`,
    });

    // 9) Forward to additional recipients if desired
    const fileId = message.document?.file_id;
    if (fileId) {

      for (const recipientId of additionalRecipients) {
        if (recipientId !== ctx.from?.id) {
          await ctx.api.sendDocument(recipientId, fileId, {
            caption:
              `Rewards created for all approved registrants of "${ctx.session.sbtEventTitle}".\n` +
              `Total rows processed: ${results.length}\n` +
              `Distributed by: ${uploaderUsername}`,
          });
        }
      }
    }

  } catch (err) {
    await ctx.reply(`Error creating rewards for all approved: ${err}`);
  }

  // 10) reset flow
  ctx.session.sbtdistStep = undefined;
  ctx.session.sbtEventUUID = undefined;
  ctx.session.sbtEventTitle = undefined;
}
