import { db } from "@/db/db";
import { eq, sql } from "drizzle-orm";
import { logger } from "@/server/utils/logger";
import { nftApiCollections, NftApiCollections, NftApiCollectionsInsert } from "@/db/schema/nftApiCollections";
// import { redisTools } from "@/lib/redisTools";

export const nftApiCollectionsDB = {
  /**
   * Get by ID
   */
  async getById(id: number): Promise<NftApiCollections | undefined> {
    try {
      const [row] = await db.select().from(nftApiCollections).where(eq(nftApiCollections.id, id)).execute();
      return row;
    } catch (error) {
      logger.error("nftApiCollectionsDB: Error fetching by ID:", error);
      throw error;
    }
  },

  /**
   * Create a new collection row
   */
  async create(data: NftApiCollectionsInsert): Promise<NftApiCollections> {
    try {
      const [inserted] = await db.insert(nftApiCollections).values(data).returning().execute();
      logger.info("nftApiCollectionsDB: Collection inserted:", inserted);
      // optional caching
      return inserted;
    } catch (error) {
      logger.error("nftApiCollectionsDB: Error inserting:", error);
      throw error;
    }
  },

  /**
   * Update by ID
   */
  async updateById(id: number, data: Partial<NftApiCollectionsInsert>): Promise<NftApiCollections | undefined> {
    try {
      const [updated] = await db
        .update(nftApiCollections)
        .set(data)
        .where(eq(nftApiCollections.id, id))
        .returning()
        .execute();
      return updated;
    } catch (error) {
      logger.error("nftApiCollectionsDB: Error updating by ID:", error);
      throw error;
    }
  },

  /**
   * Example: increment some numeric field (like salesCount)
   */
  async incrementSalesCount(id: number): Promise<NftApiCollections | undefined> {
    try {
      const [updated] = await db
        .update(nftApiCollections)
        .set({
          // For example if you store "salesCount" in collection
          // salesCount: sql`${nftApiCollections.salesCount} + 1`
        })
        .where(eq(nftApiCollections.id, id))
        .returning()
        .execute();
      return updated;
    } catch (error) {
      logger.error("nftApiCollectionsDB: Error incrementing salesCount:", error);
      throw error;
    }
  },
};
