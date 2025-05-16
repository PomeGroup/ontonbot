import { Composer, InlineKeyboard, InputFile } from "grammy";
import { MyContext } from "../types/MyContext";
import {
  isUserAdmin,
  getEvent,
  getEventTickets,
  getOrCreateSingleInviteLinkForUserAndChat
} from "../db/db";
import { parse } from "csv-parse/sync";
import axios from "axios";
import { isNewCommand } from "../helpers/isNewCommand";
import { logger } from "../utils/logger";
import {
  checkBotIsAdmin,
  escapeCsv,
  extractInviteChatIds,
  generateBroadcastGroupTitle,
  normalizeDashes,
  sleep
} from "../utils/utils";
import { additionalRecipients, AFFILIATE_PLACEHOLDERS, INVITE_PLACEHOLDER_REGEX } from "../constants";
import { Readable } from "stream";
import { getOrCreateSingleAffiliateLink } from "../db/affiliateLinks";


export const broadcastComposer = new Composer<MyContext>();



/* -------------------------------------------------------------------------- */
/* /broadcast Command => user picks event or CSV                              */
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

  const kb = new InlineKeyboard()
      .text("Event Participants", "bc_event")
      .text("Custom CSV", "bc_csv");

  await ctx.reply("Who do you want to broadcast to?", { reply_markup: kb });
});

/* -------------------------------------------------------------------------- */
/* Step => user picks event or CSV                                            */
/* -------------------------------------------------------------------------- */
broadcastComposer.on("callback_query:data", async (ctx, next) => {
  if (ctx.session.broadcastStep !== "chooseTarget") return next();
  await ctx.answerCallbackQuery();

  const choice = ctx.callbackQuery.data;
  if (choice === "bc_event") {
    ctx.session.broadcastType = "event";
    ctx.session.broadcastStep = "askEventUuid";
    await ctx.reply("Please send the Event UUID (36 characters).");
    return;
  } else if (choice === "bc_csv") {
    ctx.session.broadcastType = "csv";
    ctx.session.broadcastStep = "askCsv";
    await ctx.reply("Please upload your CSV file now (one user_id per line).");
    return;
  }
});

/* -------------------------------------------------------------------------- */
/* Step => handle event UUID or CSV => then askBroadcast                     */
/* -------------------------------------------------------------------------- */
broadcastComposer.on("message", async (ctx, next) => {
  if (isNewCommand(ctx)) {
    ctx.session = {};
    return next();
  }

  const step = ctx.session.broadcastStep;

  if (step === "askEventUuid" && ctx.message?.text) {
    return handleEventUuid(ctx);
  } else if (step === "askCsv" && ctx.message?.document) {
    return handleCsvUpload(ctx);
  } else if (step === "askBroadcast") {
    return handleBroadcastMessage(ctx);
  }

  return next();
});

/* -------------------------------------------------------------------------- */
/* handleEventUuid => fetch participants => store user IDs => askBroadcast   */
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
        `No participants found for event "${eventRow.title}". Nothing to broadcast.`
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
/* handleCsvUpload => parse CSV => store user IDs => askBroadcast            */
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

  // Download CSV from Telegram
  const fileInfo = await ctx.api.getFile(doc.file_id);
  if (!fileInfo.file_path) {
    await ctx.reply("Unable to retrieve file path from Telegram.");
    return;
  }

  const url = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${fileInfo.file_path}`;
  try {
    const res = await axios.get<ArrayBuffer>(url, { responseType: "arraybuffer" });
    const buffer = Buffer.from(res.data);
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
        "Placeholders {invite:<chatID>} for single-use links; {onion1-campaign} etc. for affiliates.",
    );
  } catch (err) {
    await ctx.reply(`Error parsing CSV: ${String(err)}`);
    ctx.session.broadcastStep = "done";
  }
}

/* -------------------------------------------------------------------------- */
/* handleBroadcastMessage => final => send to user IDs, track errors         */
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
/* handleEventBroadcast => copyMessage, no placeholders                      */
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
    } catch (err) {
      logger.warn(`Failed to send to user ${userId}: ${err}`);
      errors.push({ user_id: userId, error: String(err) });
    }
    await sleep(100);
  }

  await finalizeBroadcast(ctx, sourceChatId, sourceMessageId, errors, successCount);
}

/* -------------------------------------------------------------------------- */
/* handleCsvBroadcastWithPlaceholders => pre-check => if all ok => broadcast */
/* -------------------------------------------------------------------------- */
async function handleCsvBroadcastWithPlaceholders(ctx: MyContext, userIds: string[]) {
  const msg = ctx.message;
  const sourceChatId = msg.chat?.id!;
  const sourceMessageId = msg.message_id;

  // 1) Extract text or caption
  const isText = Boolean(msg.text);
  const caption = msg.caption || "";
  const baseText = isText ? msg.text! : caption;

  // 2) Gather all chat IDs from {invite:<chatId>}
  const chatIds = extractInviteChatIds(baseText);

  // 3) Check if bot is admin for each chat. If any fail => abort
  for (const chatId of chatIds) {
    const isAdmin = await checkBotIsAdmin(ctx.api, chatId);
    if (!isAdmin) {
      await ctx.reply(
          `❌ The bot is NOT an admin in chatId=${chatId}.\n` +
          "Please make the bot admin and restart the process."
      );
      // Clear session
      ctx.session = {};
      await ctx.reply("Operation canceled. Your active flow(s) have been cleared.");
      return;
    }
  }

  // 4) All placeholders valid => proceed
  await ctx.reply(`All placeholders are valid. Now sending to ${userIds.length} users...`);
  const errors: { user_id: string; error: string }[] = [];
  let successCount = 0;
  const broadcastGroupTitle = generateBroadcastGroupTitle();

  const isPhoto = Boolean(msg.photo);
  const isVideo = Boolean(msg.video);

  for (const userId of userIds) {
    const userIdNum = parseInt(userId, 10);
    const replacedText = await replacePlaceholdersAndLinks(
        baseText,
        userIdNum,
        broadcastGroupTitle,
        ctx
    );
    try {
      if (isText) {
        await ctx.api.sendMessage(userIdNum, replacedText, { parse_mode: "HTML" });
      } else if (isPhoto && msg.photo) {
        const largest = msg.photo[msg.photo.length - 1];
        await ctx.api.sendPhoto(userIdNum, largest.file_id, {
          caption: replacedText,
          parse_mode: "HTML",
        });
      } else if (isVideo && msg.video) {
        await ctx.api.sendVideo(userIdNum, msg.video.file_id, {
          caption: replacedText,
          parse_mode: "HTML",
        });
      } else {
        // fallback for other media
        await ctx.api.copyMessage(userIdNum, sourceChatId, sourceMessageId);
      }
      successCount++;
    } catch (err) {
      logger.warn(`Failed to send to user ${userId}: ${err}`);
      errors.push({ user_id: userId, error: String(err) });
    }
    await sleep(100);
  }

  await finalizeBroadcast(ctx, sourceChatId, sourceMessageId, errors, successCount);
}

/* -------------------------------------------------------------------------- */
/* finalizeBroadcast => handle summary, CSV, notify admins                   */
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
/* notifyAdmins => forward the original broadcast + any error CSV            */
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

    try {
      await ctx.api.sendMessage(adminId, summaryText);
    } catch (err) {
      logger.warn(`Could not send summary to admin ${adminId}: ${err}`);
    }

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
/* replacePlaceholdersAndLinks => merges affiliate placeholders + single-use link from DB */
/* -------------------------------------------------------------------------- */
async function replacePlaceholdersAndLinks(
    baseText: string,
    userId: number,
    broadcastGroupTitle: string,
    ctx: MyContext
): Promise<string> {
  // Normalize fancy dashes
  let newText = normalizeDashes(baseText);

  // 1) handle affiliate placeholders
  for (const ph of AFFILIATE_PLACEHOLDERS) {
    if (!newText.includes(ph)) continue;
    const itemType = ph.replace(/[{}]/g, "");
    const baseTitle = `broadcast-${itemType}-${userId}`;

    try {
      const linkRow = await getOrCreateSingleAffiliateLink(
          userId,
          itemType,
          baseTitle,
          broadcastGroupTitle
      );
      const finalLinkUrl = `https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME}/event?startapp=campaign-aff-${linkRow.link_hash}`;
      newText = newText.replace(ph, finalLinkUrl);
    } catch (err) {
      logger.error(`Error creating affiliate link for user ${userId}, ph=${ph}: ${err}`);
      newText = newText.replace(ph, "[LINK_ERROR]");
    }
  }

  // 2) handle invite placeholders => we create or reuse single invite link from DB
  const invites = Array.from(newText.matchAll(INVITE_PLACEHOLDER_REGEX));
  for (const match of invites) {
    const fullPlaceholder = match[0]; // e.g. "{invite:-1001234567890}"
    const chatIdStr = match[1];
    const chatId = parseInt(chatIdStr, 10);

    try {
      // We do not call createChatInviteLink directly. Instead:
      const userInviteLink = await getOrCreateSingleInviteLinkForUserAndChat(
          ctx.api,
          userId,
          chatId
      );
      newText = newText.replace(fullPlaceholder, userInviteLink);
    } catch (err) {
      logger.warn(`getOrCreateSingleInviteLinkForUserAndChat error userId=${userId} chatId=${chatId}: ${err}`);
      newText = newText.replace(fullPlaceholder, "[LINK_ERROR]");
    }
  }

  return newText;
}


