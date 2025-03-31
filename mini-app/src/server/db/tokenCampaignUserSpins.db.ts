import { db } from "@/db/db";
import { eq } from "drizzle-orm";
import { logger } from "@/server/utils/logger";
import {
  tokenCampaignUserSpins,
  TokenCampaignUserSpins,
  TokenCampaignUserSpinsInsert,
} from "@/db/schema/tokenCampaignUserSpins";
import type { PgTransaction } from "drizzle-orm/pg-core/session";
import { PostgresJsQueryResultHKT } from "drizzle-orm/postgres-js";

/* ------------------------------------------------------------------
   Insert Methods
------------------------------------------------------------------ */

/**
 * Insert a new spin (outside a transaction).
 * Returns the inserted record or undefined if none.
 */
export const addUserSpin = async (data: TokenCampaignUserSpinsInsert): Promise<TokenCampaignUserSpins | undefined> => {
  try {
    const [inserted] = await db.insert(tokenCampaignUserSpins).values(data).returning().execute();

    if (inserted) {
      logger.log("User spin inserted:", inserted);
      return inserted;
    }
    return undefined;
  } catch (error) {
    logger.error("Error inserting user spin:", error);
    throw error;
  }
};

/**
 * Insert a new spin within a transaction.
 * Returns the inserted record or undefined if none.
 */
export const addUserSpinTx = async (
  tx: PgTransaction<PostgresJsQueryResultHKT>,
  data: TokenCampaignUserSpinsInsert
): Promise<TokenCampaignUserSpins | undefined> => {
  const [inserted] = await tx.insert(tokenCampaignUserSpins).values(data).returning().execute();

  if (inserted) {
    logger.log("User spin inserted in transaction:", inserted);
  }
  return inserted;
};

/* ------------------------------------------------------------------
   Get Methods
------------------------------------------------------------------ */

/**
 * Fetch a user spin by primary key (id).
 * Returns a single record or undefined if not found.
 */
export const getUserSpinById = async (id: number): Promise<TokenCampaignUserSpins | undefined> => {
  try {
    const [spin] = await db.select().from(tokenCampaignUserSpins).where(eq(tokenCampaignUserSpins.id, id)).execute();

    return spin;
  } catch (error) {
    logger.error("Error fetching user spin by ID:", error);
    throw error;
  }
};

/**
 * Fetch all spins for a given userId.
 * Returns an array (could be empty).
 */
export const getUserSpinsByUserId = async (userId: number): Promise<TokenCampaignUserSpins[]> => {
  try {
    const spins = await db.select().from(tokenCampaignUserSpins).where(eq(tokenCampaignUserSpins.userId, userId)).execute();

    return spins;
  } catch (error) {
    logger.error("Error fetching user spins by userId:", error);
    throw error;
  }
};

/**
 * Fetch all spins by spinPackageId.
 * Returns an array (could be empty).
 */
export const getUserSpinsBySpinPackageId = async (spinPackageId: number): Promise<TokenCampaignUserSpins[]> => {
  try {
    const spins = await db
      .select()
      .from(tokenCampaignUserSpins)
      .where(eq(tokenCampaignUserSpins.spinPackageId, spinPackageId))
      .execute();

    return spins;
  } catch (error) {
    logger.error("Error fetching user spins by spinPackageId:", error);
    throw error;
  }
};

/**
 * Fetch all spins by nftCollectionId.
 * Returns an array (could be empty).
 */
export const getUserSpinsByNftCollectionId = async (nftCollectionId: number): Promise<TokenCampaignUserSpins[]> => {
  try {
    const spins = await db
      .select()
      .from(tokenCampaignUserSpins)
      .where(eq(tokenCampaignUserSpins.nftCollectionId, nftCollectionId))
      .execute();

    return spins;
  } catch (error) {
    logger.error("Error fetching user spins by nftCollectionId:", error);
    throw error;
  }
};

/* ------------------------------------------------------------------
   Update Methods
------------------------------------------------------------------ */

/**
 * Update a spin by ID (outside of a transaction).
 * Accepts partial data to update. Returns the updated record or undefined.
 */
export const updateUserSpinById = async (
  id: number,
  data: Partial<TokenCampaignUserSpinsInsert>
): Promise<TokenCampaignUserSpins | undefined> => {
  try {
    const [updated] = await db
      .update(tokenCampaignUserSpins)
      .set(data)
      .where(eq(tokenCampaignUserSpins.id, id))
      .returning()
      .execute();

    if (updated) {
      logger.log("User spin updated:", updated);
    }
    return updated;
  } catch (error) {
    logger.error("Error updating user spin by ID:", error);
    throw error;
  }
};

/**
 * Update a spin by ID within a transaction.
 * Accepts partial data. Returns the updated record or undefined.
 */
export const updateUserSpinByIdTx = async (
  tx: PgTransaction<PostgresJsQueryResultHKT>,
  id: number,
  data: Partial<TokenCampaignUserSpinsInsert>
): Promise<TokenCampaignUserSpins | undefined> => {
  const [updated] = await tx
    .update(tokenCampaignUserSpins)
    .set(data)
    .where(eq(tokenCampaignUserSpins.id, id))
    .returning()
    .execute();

  if (updated) {
    logger.log("User spin updated in transaction:", updated);
  }
  return updated;
};

/* ------------------------------------------------------------------
   Export a single object with all the methods
------------------------------------------------------------------ */

export const tokenCampaignUserSpinsDB = {
  addUserSpin,
  addUserSpinTx,
  getUserSpinById,
  getUserSpinsByUserId,
  getUserSpinsBySpinPackageId,
  getUserSpinsByNftCollectionId,
  updateUserSpinById,
  updateUserSpinByIdTx,
};
