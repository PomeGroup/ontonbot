import { Composer, InlineKeyboard } from "grammy";
import { MyContext } from "../types/MyContext";
import {
  isUserAdmin,
  getEvent,
  getEventTickets,
  getOrCreateSingleInviteLinkForUserAndChat,
} from "../db/db";
import {
  createBroadcastMessage,
  bulkInsertBroadcastUsers,
} from "../db/broadcast";
import { parse } from "csv-parse/sync";
import axios from "axios";
import { isNewCommand } from "../helpers/isNewCommand";
import { logger } from "../utils/logger";
import {
  checkBotIsAdmin,
  extractInviteChatIds,
} from "../utils/utils";
import { AFFILIATE_PLACEHOLDERS, INVITE_PLACEHOLDER_REGEX } from "../constants";
import { getOrCreateSingleAffiliateLink } from "../db/affiliateLinks";
import {json} from "express";

export const broadcastComposer = new Composer<MyContext>();

/* -------------------------------------------------------------------------- */
/* /broadcast – entry                                                         */
/* -------------------------------------------------------------------------- */
broadcastComposer.command("broadcast", async (ctx) => {
  const { isAdmin } = await isUserAdmin(ctx.from?.id.toString() || "");
  if (!isAdmin) return;

  /* reset wizard state */
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
/* Callback‑query router                                                      */
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
  }
  if (choice === "bc_csv") {
    ctx.session.broadcastType = "csv";
    ctx.session.broadcastStep = "askCsv";
    await ctx.reply("Please upload your CSV file now (one user_id per line).");
    return;
  }
});

/* -------------------------------------------------------------------------- */
/* Message router                                                             */
/* -------------------------------------------------------------------------- */
broadcastComposer.on("message", async (ctx, next) => {
  if (isNewCommand(ctx)) {
    ctx.session = {} as any;
    return next();
  }

  switch (ctx.session.broadcastStep) {
    case "askEventUuid":
      if (ctx.message?.text) return handleEventUuid(ctx);
      break;
    case "askCsv":
      if (ctx.message?.document) return handleCsvUpload(ctx);
      break;
    case "askBroadcast":
      return handleBroadcastMessage(ctx);
  }

  return next();
});

/* -------------------------------------------------------------------------- */
/* Step: Event UUID                                                            */
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
        `No participants found for event \"${eventRow.title}\". Nothing to broadcast.`,
    );
    ctx.session.broadcastStep = "done";
    return;
  }

  ctx.session.broadcastEventUuid = uuidCandidate;
  ctx.session.broadcastEventTitle = eventRow.title;
  ctx.session.broadcastUserIds = tickets.map((t) => String(t.user_id));
  ctx.session.broadcastStep = "askBroadcast";

  await ctx.reply(
      `✅ Event \"${eventRow.title}\" found with ${tickets.length} participant(s).\n` +
      "Now send any message (text, photo, video, etc.) you want to broadcast.",
  );
}

/* -------------------------------------------------------------------------- */
/* Step: CSV upload                                                            */
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
/* Step: receive the actual message to broadcast                               */
/* -------------------------------------------------------------------------- */
async function handleBroadcastMessage(ctx: MyContext) {
  const userIds = ctx.session.broadcastUserIds;
  if (!userIds?.length) {
    await ctx.reply("No valid user IDs to broadcast. Flow ended.");
    ctx.session.broadcastStep = "done";
    return;
  }

  /* ------------------------------------------------------------- */
  /* For CSV broadcasts: validate that the bot is admin in all      */
  /* chats referenced by {invite:<chatId>} placeholders so the cron */
  /* won't crash later.                                             */
  /* ------------------------------------------------------------- */
  if (ctx.session.broadcastType === "csv") {
    const msg = ctx.message!;
    const baseText = msg.text ?? msg.caption ?? "";

    // 1) ensure bot admin rights for every chatID used
    for (const chatId of extractInviteChatIds(baseText)) {
      const isAdmin = await checkBotIsAdmin(ctx.api, chatId);
      if (!isAdmin) {
        await ctx.reply(
            `❌ The bot is NOT an admin in chatId=${chatId}.\n` +
            "Please make the bot admin and restart the process.",
        );
        ctx.session.broadcastStep = "done";
        return;
      }
    }
  }

  /* ------------------------------------------------------------- */
  /*   persist broadcast + recipients, with error handling          */
  /* ------------------------------------------------------------- */
  try {
    const rawText =
        ctx.message?.text ??
        ctx.message?.caption ??
        null;                    // media without caption → null

    const broadcastId = await createBroadcastMessage({
      broadcaster_id: ctx.from!.id,
      source_chat_id: ctx.chat!.id,
      source_message_id: ctx.message!.message_id,
      broadcast_type: ctx.session.broadcastType as "event" | "csv",
      event_uuid: ctx.session.broadcastEventUuid ?? null,
      title: ctx.session.broadcastEventTitle ?? "(custom list)",
      message_text: rawText,
    });

    await bulkInsertBroadcastUsers(broadcastId, userIds);

    /* success → inform admin */
    await ctx.reply(
        `✅ Broadcast queued! ${userIds.length} user(s) will receive the message shortly.\n` +
        "You can safely close Telegram – delivery runs in the background.",
    );
  } catch (err) {
    logger.error(`broadcastComposer: DB error while queuing broadcast: ${err}`);

    await ctx.reply(
        "❌ Failed to queue the broadcast.\n" +
        JSON.stringify(err, null, 2) + "\n" +
        "Please try again later or contact support.",
    );
  }

  ctx.session.broadcastStep = "done";
}
