import { db } from "@/db/db";
import { affiliateClick } from "@/db/schema/affiliateClick";
import { affiliateLinks } from "@/db/schema/affiliateLinks";
import { eq, sql } from "drizzle-orm";
import { logger } from "@/server/utils/logger";
import { redisTools } from "@/lib/redisTools";
import { affiliateLinksDB } from "@/server/db/affiliateLinks.db";

/**
 * We'll store individual click data in a Redis list named "affiliate_clicks_queue".
 * Each entry is a JSON object with { affiliateLinkId, userId, createdAt }.
 */
const CLICK_QUEUE_KEY = "affiliate_clicks_queue";

/**
 * Minimal interface for the click data we store in Redis.
 */
interface EnqueuedClick {
  affiliateLinkId: number; // references affiliate_links.id
  userId: number; // references user ID or can be 0 if unknown
  createdAt?: number; // store a timestamp if you want; optional
}

/**
 * 1) Enqueue a single click into Redis.
 */
export async function enqueueClick(affiliateLinkId: number, userId: number, createdAt?: number) {
  try {
    const payload: EnqueuedClick = {
      affiliateLinkId,
      userId,
      createdAt: createdAt ?? Date.now(),
    };
    // Push the JSON to the end of the list
    await redisTools.redisClient.rpush(CLICK_QUEUE_KEY, JSON.stringify(payload));
    logger.log(`Enqueued click linkId=${affiliateLinkId}, userId=${userId}`);
  } catch (err) {
    logger.error("Error enqueueing affiliate click:", err);
    throw err;
  }
}

/**
 * 2) Consumer function: read up to `batchSize` clicks from Redis,
 *    insert them into `affiliate_click` in a single batch,
 *    then aggregate counts and update `affiliate_links.total_clicks`.
 *
 *    Call this function e.g. once per minute from a cron job or background worker.
 */
export async function consumeClickBatch(batchSize = 500) {
  try {
    // 1) Pop up to batchSize from the queue
    const enqueued: EnqueuedClick[] = [];
    for (let i = 0; i < batchSize; i++) {
      const raw = await redisTools.redisClient.lpop(CLICK_QUEUE_KEY);
      if (!raw) {
        break; // queue is empty
      }
      try {
        const parsed = JSON.parse(raw) as EnqueuedClick;
        // Validate at least affiliateLinkId
        if (!parsed.affiliateLinkId || !parsed.userId) {
          continue; // skip if missing required fields
        }
        enqueued.push(parsed);
      } catch (err) {
        logger.error("Invalid JSON in affiliate click queue:", err);
      }
    }

    if (enqueued.length === 0) {
      logger.log("No clicks to process in this batch.");
      return;
    }

    logger.log(`Processing ${enqueued.length} affiliate clicks...`);

    // 2) Insert them into Postgres `affiliate_click` in one batch
    // Build an array of row objects that match your `affiliate_click` schema
    const rowsToInsert = enqueued.map((click) => ({
      affiliateLinkId: click.affiliateLinkId,
      userId: click.userId,
      createdAt: new Date(click.createdAt || Date.now()),
    }));

    // Insert in one call if possible
    await db.insert(affiliateClick).values(rowsToInsert).execute();
    logger.log(`Inserted ${rowsToInsert.length} rows into affiliate_click table.`);

    // 3) Aggregate total new clicks by linkId => how many times each linkId appeared
    const incrementByLinkId: Record<number, number> = {};
    for (const c of enqueued) {
      incrementByLinkId[c.affiliateLinkId] = (incrementByLinkId[c.affiliateLinkId] || 0) + 1;
    }

    // 4) For each linkId, update affiliate_links.total_clicks
    //    Then clear the cache for that link if needed
    for (const linkIdStr of Object.keys(incrementByLinkId)) {
      const linkId = Number(linkIdStr);
      const sum = incrementByLinkId[linkId];
      try {
        await db
          .update(affiliateLinks)
          .set({
            totalClicks: sql`${affiliateLinks.totalClicks} +
            ${sum}`,
          })
          .where(eq(affiliateLinks.id, linkId))
          .execute();

        // If you store affiliate link caches by ID or hash, remove them. E.g.:
        // const cacheKey = `affiliate_link_by_id:${linkId}`;
        // await redisTools.deleteCache(cacheKey);

        logger.log(`Updated total_clicks by +${sum} for affiliateLink.id=${linkId}`);
      } catch (err) {
        logger.error(`Error updating total_clicks for linkId=${linkId}`, err);
      }
    }

    logger.log(
      `Batch consume complete. Inserted ${rowsToInsert.length} clicks, updated ${Object.keys(incrementByLinkId).length} links.`
    );
  } catch (err) {
    logger.error("Error in consumeClickBatch:", err);
    throw err;
  }
}
