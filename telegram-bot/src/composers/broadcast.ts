import { Composer, InlineKeyboard, InputFile } from "grammy";
import { MyContext } from "../types/MyContext";
import {
  isUserAdmin,
  getEvent,
  getEventTickets,
  createAffiliateLinks,
} from "../db/db";
import { parse } from "csv-parse/sync";
import axios from "axios";
import { isNewCommand } from "../helpers/isNewCommand";
import { logger } from "../utils/logger";
import { sleep } from "../utils/utils";
import { additionalRecipients } from "../constants";
import { Readable } from "stream";
import { pool } from "../db/pool"; // for manual queries

export const broadcastComposer = new Composer<MyContext>();

// Placeholders you want to handle
const PLACEHOLDERS = [
  "{onion1-special-affiliations}",
  "{onion1-campaign}",
];

/* -------------------------------------------------------------------------- */
/*    1) generateBroadcastGroupTitle => used to set a common group_title      */

/* -------------------------------------------------------------------------- */
function generateBroadcastGroupTitle(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  return `broad-cast-${y}${m}${d}${hh}${mm}${ss}`;
}

/* -------------------------------------------------------------------------- */
/*  2) getOrCreateSingleAffiliateLink => checks if link exists; if not, make  */

/* -------------------------------------------------------------------------- */
async function getOrCreateSingleAffiliateLink(
  userId: number,
  itemType: string,
  baseTitle: string,
  groupTitle: string,
) {
  const client = await pool.connect();
  try {
    // 1) Check if a link already exists for this user & itemType with item_id=0
    const sqlCheck = `
        SELECT id, link_hash, title, group_title
        FROM affiliate_links
        WHERE "item_type" = $1
          AND "Item_id" = 0
          AND "affiliator_user_id" = $2
        LIMIT 1
    `;
    const resCheck = await client.query(sqlCheck, [itemType, userId]);
    if (resCheck.rowCount > 0) {
      // Found an existing link => optionally update group_title
      const existingLink = resCheck.rows[0];
      // If you always want to override group_title with the current broadcast groupTitle, do:
      if (existingLink.group_title !== groupTitle) {
        await client.query(
          "UPDATE affiliate_links SET \"group_title\"=$1 WHERE \"id\"=$2",
          [groupTitle, existingLink.id],
        );
      }
      return {
        id: existingLink.id,
        link_hash: existingLink.link_hash,
        title: existingLink.title,
        group_title: groupTitle,
      };
    }

    // 2) If not found => create a new link via createAffiliateLinks (count=1)
    // But we can't do that inside the same client query easily. We'll just do it outside:
  } finally {
    client.release();
  }

  // 3) Create a new link (with eventId=0, itemType, userId, baseTitle)
  const creation = await createAffiliateLinks({
    eventId: 0,        // dummy event
    userId: userId,
    itemType,
    baseTitle,
    count: 1,          // just one link
  });
  const newLink = creation.links[0];

  // 4) Update group_title
  const client2 = await pool.connect();
  try {
    await client2.query(
      "UPDATE affiliate_links SET \"group_title\"=$1 WHERE \"id\"=$2",
      [groupTitle, newLink.id],
    );
  } finally {
    client2.release();
  }

  // Return updated link
  return {
    id: newLink.id,
    link_hash: newLink.link_hash,
    title: newLink.title,
    group_title: groupTitle,
  };
}

/* -------------------------------------------------------------------------- */
/*                 /broadcast Command => choose event or csv                 */
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

  const kb = new InlineKeyboard()
    .text("Event Participants", "bc_event")
    .text("Custom CSV", "bc_csv");

  await ctx.reply("Who do you want to broadcast to?", { reply_markup: kb });
});

/* -------------------------------------------------------------------------- */
/*             3) Inline buttons => "event" or "csv"                         */
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
/*        4) Next message => event UUID or CSV => then askBroadcast          */
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
/*     handleEventUuid => fetch participants, store user IDs, askBroadcast   */

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
    "Now send any message (text, photo, video, etc.) you want to broadcast (no placeholder replacements).",
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
      "Now send any message (text, photo, video, etc.) you want to broadcast.\n" +
      "Placeholders {onion1-special-affiliations} and {onion1-campaign} will be replaced with existing or new custom links (unique per user).",
    );
  } catch (err) {
    await ctx.reply(`Error parsing CSV: ${err}`);
    ctx.session.broadcastStep = "done";
  }
}

/* -------------------------------------------------------------------------- */
/*     handleBroadcastMessage => final step => send to user IDs, track errors */

/* -------------------------------------------------------------------------- */
async function handleBroadcastMessage(ctx: MyContext) {
  const userIds = ctx.session.broadcastUserIds;
  if (!userIds?.length) {
    await ctx.reply("No valid user IDs to broadcast. Flow ended.");
    ctx.session.broadcastStep = "done";
    return;
  }

  if (ctx.session.broadcastType === "event") {
    await handleEventBroadcast(ctx, userIds);
  } else {
    await handleCsvBroadcastWithPlaceholders(ctx, userIds);
  }

  ctx.session.broadcastStep = "done";
}

/* -------------------------------------------------------------------------- */
/*              handleEventBroadcast => copyMessage no placeholders          */

/* -------------------------------------------------------------------------- */
async function handleEventBroadcast(ctx: MyContext, userIds: string[]) {
  const sourceChatId = ctx.chat?.id;
  const sourceMessageId = ctx.message?.message_id;
  if (!sourceChatId || !sourceMessageId) {
    await ctx.reply("Unable to read the message ID or chat ID. Flow ended.");
    return;
  }

  await ctx.reply(`Broadcasting this message to ${userIds.length} users...`);

  const errors: { user_id: string; error: string }[] = [];
  let successCount = 0;

  for (const userId of userIds) {
    try {
      await ctx.api.copyMessage(userId, sourceChatId, sourceMessageId);
      successCount++;
    } catch (err: any) {
      logger.warn(`Failed to send to user ${userId}: ${err}`);
      errors.push({ user_id: userId, error: String(err) });
    }
    await sleep(100);
  }

  await finalizeBroadcast(ctx, sourceChatId, sourceMessageId, errors, successCount);
}

/* -------------------------------------------------------------------------- */
/*        handleCsvBroadcastWithPlaceholders => parse text/caption           */

/* -------------------------------------------------------------------------- */
async function handleCsvBroadcastWithPlaceholders(ctx: MyContext, userIds: string[]) {
  const msg = ctx.message;
  const sourceChatId = msg.chat?.id;
  const sourceMessageId = msg.message_id;
  if (!sourceChatId || !sourceMessageId) {
    await ctx.reply("Unable to read the message or chat ID. Flow ended.");
    return;
  }

  await ctx.reply(`Broadcasting (with placeholder checks) to ${userIds.length} users...`);

  const errors: { user_id: string; error: string }[] = [];
  let successCount = 0;

  // Determine message type
  const isText = Boolean(msg.text);
  const isPhoto = Boolean(msg.photo);
  const isVideo = Boolean(msg.video);
  const caption = msg.caption || "";
  const baseText = isText ? msg.text! : caption;

  // Single groupTitle for entire broadcast
  const broadcastGroupTitle = generateBroadcastGroupTitle();

  for (const userId of userIds) {
    let replacedText = await replacePlaceholdersAndReuseLink(
      baseText,
      userId,
      broadcastGroupTitle,
    );

    try {
      if (isText) {
        await ctx.api.sendMessage(userId, replacedText, { parse_mode: "HTML" });
      } else if (isPhoto && msg.photo) {
        const largest = msg.photo[msg.photo.length - 1];
        await ctx.api.sendPhoto(userId, largest.file_id, {
          caption: replacedText,
          parse_mode: "HTML",
        });
      } else if (isVideo && msg.video) {
        await ctx.api.sendVideo(userId, msg.video.file_id, {
          caption: replacedText,
          parse_mode: "HTML",
        });
      } else {
        // fallback for other media
        await ctx.api.copyMessage(userId, sourceChatId, sourceMessageId);
      }
      successCount++;
    } catch (err: any) {
      logger.warn(`Failed to send to user ${userId}: ${err}`);
      errors.push({ user_id: userId, error: String(err) });
    }
    await sleep(100);
  }

  await finalizeBroadcast(ctx, sourceChatId, sourceMessageId, errors, successCount);
}

/* -------------------------------------------------------------------------- */
/*           finalizeBroadcast => handle summary, CSV, notify admins         */

/* -------------------------------------------------------------------------- */
async function finalizeBroadcast(
  ctx: MyContext,
  sourceChatId: number,
  sourceMsgId: number,
  errors: { user_id: string; error: string }[],
  successCount: number,
) {
  await ctx.reply(`✅ Broadcast complete. Sent to ${successCount} user(s).`);
  if (errors.length === 0) {
    await ctx.reply("No errors occurred during the broadcast!");
    await notifyAdmins(ctx, sourceChatId, sourceMsgId, null, successCount);
  } else {
    const header = "user_id,error";
    const csvRows = errors.map((e) => `${e.user_id},${escapeCsv(e.error)}`);
    const finalCsvString = [header, ...csvRows].join("\n");

    const fileName = "broadcast_errors.csv";
    const fileStream = Readable.from(finalCsvString);
    const inputFile = new InputFile(fileStream, fileName);

    const docMsg = await ctx.replyWithDocument(inputFile, {
      caption: `There were ${errors.length} errors. See details in the CSV.`,
    });

    await notifyAdmins(ctx, sourceChatId, sourceMsgId, docMsg.document?.file_id, successCount);
  }
}

/* -------------------------------------------------------------------------- */
/*     notifyAdmins => forward the original broadcast + any error CSV        */

/* -------------------------------------------------------------------------- */
async function notifyAdmins(
  ctx: MyContext,
  broadcastSourceChatId: number,
  broadcastSourceMsgId: number,
  errorCsvFileId: string | null | undefined,
  successCount: number,
) {
  const summaryText = `Broadcast summary:\n- Success count: ${successCount}\n`;

  for (const adminId of additionalRecipients) {
    try {
      await ctx.api.copyMessage(adminId, broadcastSourceChatId, broadcastSourceMsgId, {
        caption: "This was the broadcasted message (original).",
      });
    } catch (err) {
      logger.warn(`Could not forward broadcast to admin ${adminId}: ${err}`);
    }

    // summary
    try {
      await ctx.api.sendMessage(adminId, summaryText);
    } catch (err) {
      logger.warn(`Could not send summary to admin ${adminId}: ${err}`);
    }

    // CSV if any
    if (errorCsvFileId) {
      try {
        await ctx.api.sendDocument(adminId, errorCsvFileId, {
          caption: "Broadcast encountered errors. See CSV.",
        });
      } catch (err) {
        logger.warn(`Could not send CSV to admin ${adminId}: ${err}`);
      }
    }
  }
}

/* -------------------------------------------------------------------------- */
/* replacePlaceholdersAndReuseLink => for each placeholder, get existing link */
/* or create new if not found. Then replace text with that link.             */

/* -------------------------------------------------------------------------- */
async function replacePlaceholdersAndReuseLink(
  baseText: string,
  userIdStr: string,
  broadcastGroupTitle: string,
): Promise<string> {
  let newText = baseText;
  for (const ph of PLACEHOLDERS) {
    if (!newText.includes(ph)) continue; // skip if placeholder not present

    const itemType = ph.replace(/[{}]/g, "");
    const userIdNum = parseInt(userIdStr, 10) || 0;
    const baseTitle = `broadcast-${itemType}-${userIdStr}`;

    try {
      // 1) Check if link exists => else create
      const linkRow = await getOrCreateSingleAffiliateLink(
        userIdNum,
        itemType,
        baseTitle,
        broadcastGroupTitle,
      );

      // 2) Build final URL
      const finalLinkUrl = `https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME}/event?startapp=campaign-aff-${linkRow.link_hash}`;

      // 3) Replace
      newText = newText.replace(ph, finalLinkUrl);
    } catch (err) {
      logger.error(`Error reusing/creating link for user ${userIdStr} & ph=${ph}: ${err}`);
      newText = newText.replace(ph, "[LINK_ERROR]");
    }
  }

  return newText;
}

/* -------------------------------------------------------------------------- */
/*                     Utility => escape CSV fields                          */

/* -------------------------------------------------------------------------- */
function escapeCsv(str: string): string {
  if (!str) return "";
  let s = str.replace(/"/g, "\"\"");
  if (/[,"]/.test(s)) {
    s = `"${s}"`;
  }
  return s;
}
