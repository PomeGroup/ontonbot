import { Composer, InlineKeyboard, InputFile } from "grammy";
import { MyContext } from "../types/MyContext";
import {
  createAffiliateLinks,
  getEvent, getEventById,
  isUserAdmin,
  isUserOrganizerOrAdmin,
  pool,
} from "../db/db";
import { Readable } from "stream";
import { logger } from "../utils/logger";
import { checkRateLimit } from "../utils/checkRateLimit";
import * as process from "node:process";

export const affiliateComposer = new Composer<MyContext>();

/**
 *  MIDDLEWARE: Check if user is at least organizer or admin
 *  If not, we stop here.
 */
affiliateComposer.use(async (ctx, next) => {
  const userIdString = ctx.from?.id?.toString();
  if (!userIdString) {
    await ctx.reply("Could not detect your user ID. Please try again.");
    return;
  }

  const { isOrganizerOrAdmin } = await isUserOrganizerOrAdmin(userIdString);
  if (!isOrganizerOrAdmin) {
    // Stop the flow
    await ctx.reply("You are not authorized to run this command.");
    return;
  }

  // Otherwise, proceed
  await next();
});

/**
 * STEP 0: /affiliate command
 */
affiliateComposer.command("affiliate", async (ctx) => {
  // Reset session
  ctx.session.affiliateStep = undefined;
  ctx.session.affiliateLinkType = undefined;
  ctx.session.affiliateEventUUID = undefined;
  ctx.session.affiliateEventId = undefined;
  ctx.session.affiliateEventTitle = undefined;
  ctx.session.affiliateLinkCount = undefined;
  ctx.session.affiliateLinkTitle = undefined;
  ctx.session.existingLinksCount = undefined;

  // Inline keyboard: "Event", "Play-to-Earn"
  const inlineKb = new InlineKeyboard()
    .text("Event", "aff_event")
    .row()
    .text("Play-to-Earn (disabled)", "aff_p2e");

  await ctx.reply("Which type of affiliation do you want to create?", {
    reply_markup: inlineKb,
  });
});

/**
 * STEP 1: "Event" or "Play-to-Earn" button
 */
affiliateComposer.callbackQuery("aff_event", async (ctx) => {
  await ctx.answerCallbackQuery();

  const userId = ctx.from?.id;
  if (!userId) {
    await ctx.reply("Could not detect your user ID. Please try again.");
    return;
  }

  const { isAdmin } = await isUserAdmin(String(userId));

  // If admin => show all upcoming paid events
  // If organizer => only user-owned
  let sqlQuery = `
      SELECT event_uuid, event_id, title, end_date
      FROM events
      WHERE end_date > EXTRACT(EPOCH FROM now())
        AND has_payment = true
      ORDER BY end_date ASC
      LIMIT 50
  `;
  let sqlParams: any[] = [];

  if (!isAdmin) {
    sqlQuery = `
        SELECT event_uuid, event_id, title, end_date
        FROM events
        WHERE end_date > EXTRACT(EPOCH FROM now())
          AND has_payment = true
          AND owner = $1
        ORDER BY end_date ASC
        LIMIT 50
    `;
    sqlParams = [userId];
  }

  const client = await pool.connect();
  try {
    const res = await client.query(sqlQuery, sqlParams);
    if (res.rows.length === 0) {
      if (isAdmin) {
        await ctx.reply("No upcoming paid events found at all.");
      } else {
        await ctx.reply("No upcoming paid events found for you (owner).");
      }
      return;
    }

    // Build inline keyboard
    const kb = new InlineKeyboard();
    for (const row of res.rows) {
      const uuid = row.event_uuid;
      const title = row.title || "Untitled";
      kb.text(title, `choose_event_${uuid}`).row();
    }
    ctx.session.affiliateLinkType = "EVENT";
    await ctx.reply("Please select an event from the list:", {
      reply_markup: kb,
    });
    ctx.session.affiliateStep = "pickingEvent";
  } finally {
    client.release();
  }
});

affiliateComposer.callbackQuery("aff_p2e", async (ctx) => {
  await ctx.answerCallbackQuery({
    text: "Play-to-Earn affiliation is not implemented yet. Choose Event.",
    show_alert: true,
  });
});

/**
 * STEP 2: user taps "choose_event_<uuid>"
 */
affiliateComposer.callbackQuery(/^choose_event_(.*)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const uuid = ctx.match[1];
  if (!uuid) {
    await ctx.reply("No event UUID found. /cancel or try again.");
    return;
  }

  // getEvent
  const eventRow = await getEvent(uuid);
  if (!eventRow) {
    await ctx.reply("Event not found. /cancel or try again.");
    return;
  }

  // Double-check ownership or admin
  const client = await pool.connect();
  try {
    const check = await client.query(
      `SELECT event_id, owner
       FROM events
       WHERE event_uuid = $1`,
      [uuid],
    );
    if (!check.rows.length) {
      await ctx.reply("Event not found in DB. /cancel or try another.");
      return;
    }

    const { event_id, owner } = check.rows[0];
    const userId = ctx.from?.id;
    if (!userId) {
      await ctx.reply("Could not read your user ID. Please try again.");
      return;
    }

    const { isAdmin } = await isUserAdmin(String(userId));
    const isOwner = Number(owner) === userId;
    if (!isAdmin && !isOwner) {
      await ctx.reply("You lack permission to create affiliate links for this event!");
      return;
    }

    // Save event data
    ctx.session.affiliateEventUUID = uuid;
    ctx.session.affiliateEventId = event_id;
    ctx.session.affiliateEventTitle = eventRow.title;
    ctx.session.affiliateStep = "confirmEvent";

    // Ask user "Yes" or "No"
    const inlineKb = new InlineKeyboard()
      .text("Yes", "aff_ev_yes")
      .text("No", "aff_ev_no");
    await ctx.reply(
      `You selected the event: "${eventRow.title}".\nDo you want to continue?`,
      { reply_markup: inlineKb },
    );
  } finally {
    client.release();
  }
});

/**
 * STEP 2.5: "Yes" or "No"
 */
affiliateComposer.callbackQuery("aff_ev_yes", async (ctx) => {
  await ctx.answerCallbackQuery();

  const eventId = ctx.session.affiliateEventId;
  if (!eventId) {
    await ctx.reply("No event in session. /cancel or start over.");
    ctx.session.affiliateStep = undefined;
    return;
  }

  // check existing links
  const client = await pool.connect();
  try {
    const res = await client.query(
      `SELECT COUNT(*) AS total
       FROM affiliate_links
       WHERE "Item_id" = $1`,
      [eventId],
    );
    const existing = parseInt(res.rows[0]?.total ?? "0", 10);
    ctx.session.existingLinksCount = existing;
  } finally {
    client.release();
  }

  // Next step: "Add new links" or "Get report"
  ctx.session.affiliateStep = "chooseAction";
  const inlineKb = new InlineKeyboard()
    .text("Add new links", "aff_act_addLinks")
    .row()
    .text("Get report", "aff_act_report");

  await ctx.reply("What do you want to do?", {
    reply_markup: inlineKb,
  });
});

affiliateComposer.callbackQuery("aff_ev_no", async (ctx) => {
  await ctx.answerCallbackQuery();
  // Cancel
  ctx.session.affiliateStep = undefined;
  ctx.session.affiliateEventUUID = undefined;
  ctx.session.affiliateEventId = undefined;
  ctx.session.affiliateEventTitle = undefined;
  ctx.session.existingLinksCount = undefined;
  await ctx.reply("Cancelled. Type /affiliate to start over.");
});

/**
 * STEP 3: "Add new links" or "Get report"
 */
affiliateComposer.callbackQuery("aff_act_addLinks", async (ctx) => {
  await ctx.answerCallbackQuery();
  ctx.session.affiliateStep = "askCountOfLinks";
  await ctx.reply("How many links do you want to create?");
});

affiliateComposer.callbackQuery("aff_act_report", async (ctx) => {
  await ctx.answerCallbackQuery();

  // 1) Rate Limit Check
  //    2 requests allowed, window of 15 minutes (900s).
  const userId = ctx.from?.id?.toString() || "";
  const routeName = "get_report"; // or any unique identifier
  const { allowed } = await checkRateLimit(userId, routeName, 3, 900);

  if (!allowed) {
    await ctx.reply("You have reached the maximum of 3 reports per 15 minutes. Please try again later.");
    // No further code => user not allowed
    return;
  }

  // 2) If allowed, proceed with normal "Get report" logic
  ctx.session.affiliateStep = "reporting";
  const eventId = ctx.session.affiliateEventId;
  const eventTitle = ctx.session.affiliateEventTitle || "Unnamed Event";
  if (!eventId) {
    await ctx.reply("No event in session. /cancel or try again.");
    ctx.session.affiliateStep = undefined;
    return;
  }

  // 3) Generate and send the report
  try {
    const client = await pool.connect();
    try {
      const sql = `
          SELECT id,
                 link_hash,
                 title,
                 group_title,
                 "total_clicks"   AS clicks,
                 "total_purchase" AS purchases,
                 "item_type"      AS itemType,
                 "Item_id"        AS itemId
          FROM affiliate_links
          WHERE "Item_id" = $1
          ORDER BY id ASC
      `;
      const { rows } = await client.query(sql, [eventId]);
      if (!rows.length) {
        await ctx.reply(`No affiliate links found for event "${eventTitle}".`);
        ctx.session.affiliateStep = undefined;
        return;
      }

      // Build CSV
      const header = "link_id,link_hash,title,group_title,clicks,purchases";
      const csvRows = await Promise.all(
        rows.map(async (r: any) => {
          console.log(r);
          if (r.itemtype === "EVENT" && r.itemid) {
            const eventData = await getEventById(r.itemid);
            return `${r.id},https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME}/event?startapp=${eventData.event_uuid}-affiliate-${r.link_hash},${r.title || ""},${r.group_title || ""},${r.clicks},${r.purchases}`;
          } else {
            return `${r.id},https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME}/event?startapp=affiliate-${r.link_hash},${r.title || ""},${r.group_title || ""},${r.clicks},${r.purchases}`;
          }
        }),
      );
      const finalCsv = [header, ...csvRows].join("\n");
      const csvStream = Readable.from(finalCsv);

      const datePart = new Date().toISOString().split("T")[0];
      const filename = `aff-report-${eventId}-${datePart}.csv`;
      const inputFile = new InputFile(csvStream, filename);

      await ctx.replyWithDocument(inputFile, {
        caption: `Affiliate Report for Event "${eventTitle}"`,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error generating affiliate report:", error);
    await ctx.reply(`Error generating report: ${error}`);
  }

  // 4) Reset
  ctx.session.affiliateStep = undefined;
});
/**
 * STEP 4: askCountOfLinks => user types a number
 */
affiliateComposer.on("message:text", async (ctx, next) => {
  if (ctx.session.affiliateStep === "askCountOfLinks") {
    const countInput = ctx.message.text.trim();
    const countNum = parseInt(countInput, 10);

    if (isNaN(countNum) || countNum <= 0) {
      await ctx.reply("Invalid number. Please enter a positive integer.");
      return;
    }

    // Check limit 50
    const existing = ctx.session.existingLinksCount ?? 0;
    const newTotal = existing + countNum;
    if (newTotal > 50) {
      const remaining = 50 - existing;
      if (remaining <= 0) {
        await ctx.reply(
          `This event already has ${existing} affiliate links. Limit is 50 total.`,
        );
        ctx.session.affiliateStep = undefined;
        return;
      } else {
        await ctx.reply(
          `You can only create a maximum of ${remaining} more links. Enter a smaller number or /cancel.`,
        );
        return;
      }
    }

    ctx.session.affiliateLinkCount = countNum;
    ctx.session.affiliateStep = "askTitleOfLinks";
    await ctx.reply("Please enter a base title for these links:");
    return;
  }

  return next();
});

/**
 * STEP 5: askTitleOfLinks => user enters baseTitle => create links
 */
affiliateComposer.on("message:text", async (ctx, next) => {

  if (ctx.session.affiliateStep === "askTitleOfLinks") {
    const baseTitle = ctx.message.text.trim();
    if (!baseTitle) {
      await ctx.reply("Please enter a non-empty title.");
      return;
    }

    ctx.session.affiliateLinkTitle = baseTitle;
    ctx.session.affiliateStep = "generatingLinks";

    // Insert links
    const count = ctx.session.affiliateLinkCount || 0;
    const eventId = ctx.session.affiliateEventId;
    const eventUUID = ctx.session.affiliateEventUUID;
    const userId = ctx.from?.id;
    const itemType = ctx.session.affiliateLinkType;
    const eventTitle = ctx.session.affiliateEventTitle || "untitled";

    if (!eventId || !eventUUID || !userId || !itemType) {
      await ctx.reply("Missing data in session. /cancel and try again.");
      ctx.session.affiliateStep = undefined;
      return;
    }

    try {
      const { links, groupTitle } = await createAffiliateLinks({
        eventId,
        userId,
        itemType,
        baseTitle,
        count,

      });

      // Build CSV
      const header = "link_hash,title,group_title,item_type,event_id";

      const csvRows = await Promise.all(
        links.map(async (r: any) => {
          console.log(r);
          if (r.item_type === "EVENT" && r.item_id) {
            const eventData = await getEventById(r.item_id);
            return `${r.id},https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME}/event?startapp=${eventData.event_uuid}-affiliate-${r.link_hash},${r.title || ""},${r.group_title || ""},${r.clicks},${r.purchases}`;
          } else {
            return `${r.id},https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME}/event?startapp=affiliate-${r.link_hash},${r.title || ""},${r.group_title || ""},${r.clicks},${r.purchases}`;
          }
        }),
      );
      const finalCsv = [header, ...csvRows].join("\n");
      const csvStream = Readable.from(finalCsv);

      const datePart = new Date().toISOString().split("T")[0];
      const filename = `affiliate-links-${eventUUID}-${datePart}.csv`;
      const inputFile = new InputFile(csvStream, filename);

      await ctx.replyWithDocument(inputFile, {
        caption:
          `Created ${links.length} affiliate links for Event: "${eventTitle}"\n` +
          `Event UUID: ${eventUUID}\n` +
          `Base Title: ${baseTitle}\n` +
          `Group Title: ${groupTitle || "N/A"}`,
      });
    } catch (error) {
      logger.error("Error creating affiliate links:", error);
      await ctx.reply(`Error creating affiliate links: ${error}`);
    }

    // Reset
    ctx.session.affiliateStep = undefined;
    return;
  }

  return next();
});
