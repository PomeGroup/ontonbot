import { db } from "@/db/db";
import { affiliateLinks, AffiliateLinksRow } from "@/db/schema/affiliateLinks";
import { eq, sql } from "drizzle-orm";
import { redisTools } from "@/lib/redisTools";
import { logger } from "@/server/utils/logger";

// Helper to build a cache key for a single link ID
const getAffiliateLinkCacheKey = (linkHash: string) => `affiliate_link:${linkHash}`;

export async function getAffiliateLinkByHash(linkHash: string): Promise<AffiliateLinksRow | undefined> {
  try {
    const cacheKey = getAffiliateLinkCacheKey(linkHash);
    const cached = await redisTools.getCache(cacheKey);
    if (cached) {
      return cached;
    }

    const row = (await db.select().from(affiliateLinks).where(eq(affiliateLinks.linkHash, linkHash)).execute()).pop();

    if (row) {
      await redisTools.setCache(cacheKey, row, redisTools.cacheLvl.medium);
    }
    return row;
  } catch (error) {
    logger.error("Error in getAffiliateLinkById:", error);
    throw error;
  }
}

/**
 * Increments total_clicks using Drizzle's update API.
 * Example assumes your schema has a column "totalClicks" or "total_clicks".
 */
export async function incrementAffiliateClicks(linkHash: string, incrementBy = 1) {
  try {
    // Drizzle update with an SQL expression
    await db
      .update(affiliateLinks)
      .set({
        totalClicks: sql`${affiliateLinks.totalClicks} +
        ${incrementBy}`,
      })
      .where(eq(affiliateLinks.linkHash, linkHash))
      .execute();

    // Clear cache so next read is fresh
    await redisTools.deleteCache(getAffiliateLinkCacheKey(linkHash));
    logger.log(`Incremented total_clicks for link #${linkHash} by ${incrementBy}`);
  } catch (error) {
    logger.error("Error in incrementAffiliateClicks:", error);
    throw error;
  }
}

/**
 * Increments total_purchase using Drizzle's update API.
 * Example assumes your schema has a column "totalPurchase" or "total_purchase".
 */
export async function incrementAffiliatePurchase(linkHash: string, incrementBy = 1) {
  try {
    await db
      .update(affiliateLinks)
      .set({
        totalPurchase: sql`${affiliateLinks.totalPurchase} +
        ${incrementBy}`,
      })
      .where(eq(affiliateLinks.linkHash, linkHash))
      .execute();

    await redisTools.deleteCache(getAffiliateLinkCacheKey(linkHash));
    logger.log(`Incremented total_purchase for link #${linkHash} by ${incrementBy}`);
  } catch (error) {
    logger.error("Error in incrementAffiliatePurchase:", error);
    throw error;
  }
}

export const affiliateLinksDB = {
  getAffiliateLinkByHash,
  incrementAffiliateClicks,
  incrementAffiliatePurchase,
};
