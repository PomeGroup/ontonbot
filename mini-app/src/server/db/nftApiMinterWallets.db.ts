import { db } from "@/db/db";
import { eq } from "drizzle-orm";
import { logger } from "@/server/utils/logger";
import { nftApiMinterWallets, NftApiMinterWallets, NftApiMinterWalletsInsert } from "@/db/schema/nftApiMinterWallets";

export const nftApiMinterWalletsDB = {
  /**
   * Find all wallets for a given apiKeyId
   */
  async findByApiKey(apiKeyId: number): Promise<NftApiMinterWallets[]> {
    try {
      return await db.select().from(nftApiMinterWallets).where(eq(nftApiMinterWallets.apiKeyId, apiKeyId)).execute();
    } catch (error) {
      logger.error("nftApiMinterWalletsDB: Error fetching wallets by apiKeyId:", error);
      throw error;
    }
  },

  /**
   * Insert a new minter wallet row.
   */
  async insertWallet(data: NftApiMinterWalletsInsert): Promise<NftApiMinterWallets> {
    try {
      const [inserted] = await db.insert(nftApiMinterWallets).values(data).returning().execute();
      logger.info("nftApiMinterWalletsDB: Inserted wallet:", inserted);
      return inserted;
    } catch (error) {
      logger.error("nftApiMinterWalletsDB: Error inserting wallet:", error);
      throw error;
    }
  },
};
