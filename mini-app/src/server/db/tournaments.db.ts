import { db } from "@/db/db";
import { games } from "@/db/schema";
import { tournaments, TournamentsRow, TournamentsRowInsert } from "@/db/schema/tournaments";
import { cacheKeys, redisTools } from "@/lib/redisTools";
import { logger } from "@/server/utils/logger";
import crypto from "crypto";
import { and, asc, desc, eq, gt, gte, lt, lte, or } from "drizzle-orm";

const getTournamentCacheKey = (tournamentId: number) => {
  return redisTools.cacheKeys.getTournamentById + tournamentId;
};
/**
 * Insert a new row in the 'tournaments' table.
 * Returns the inserted row (TournamentsRow) or undefined if none.
 */
export const addTournament = async (tData: TournamentsRowInsert): Promise<TournamentsRow | undefined> => {
  try {
    const [inserted] = await db.insert(tournaments).values(tData).returning().execute();

    if (inserted) {
      logger.log("Tournament inserted:", inserted);
      return inserted;
    }
    return undefined;
  } catch (error) {
    logger.error("Error inserting tournament:", error);
    throw error;
  }
};

/**
 * Update the activityId of a tournament.
 * Returns the updated row (TournamentsRow) or undefined if none.
 */
export const updateActivityIdTrx = async (
  trx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  activityId: number,
  tournamentId: number
) => {
  try {
    const result = await trx
      .update(tournaments)
      .set({ activityId })
      .where(eq(tournaments.id, tournamentId))
      .returning()
      .execute();
    await redisTools.deleteCache(getTournamentCacheKey(tournamentId));
    return result;
  } catch (error) {
    logger.error("Error updating tournament activityId:", error);
    throw error;
  }
};
/**
 * Fetch a tournament by its local primary key (tournaments.id).
 * Returns a TournamentsRow or undefined if not found.
 */
export const getTournamentById = async (tournamentId: number): Promise<TournamentsRow | undefined> => {
  const cacheKey = getTournamentCacheKey(tournamentId);
  const cachedTournament: TournamentsRow = await redisTools.getCache(cacheKey);
  if (cachedTournament) {
    return cachedTournament;
  }

  try {
    const [row] = await db.select().from(tournaments).where(eq(tournaments.id, tournamentId)).execute();

    if (row) {
      await redisTools.setCache(cacheKey, row, redisTools.cacheLvl.guard);
    }

    return row;
  } catch (error) {
    logger.error("Error getting tournament by ID:", error);
    throw error;
  }
};

/**
 * Retrieve tournaments by an array of IDs.
 * Results are cached based on the provided IDs.
 */
export const getTournamentsByIds = async (ids: number[]): Promise<TournamentsRow[]> => {
  logger.log("getTournamentsByIds called with ids:", ids);
  if (ids.length === 0) {
    logger.log("No ids provided; returning an empty array");
    return [];
  }
  // Create a cache key by hashing the ids array
  const hash = crypto.createHash("md5").update(JSON.stringify(ids)).digest("hex");
  const cacheKey = cacheKeys.getTournamentsByIds + hash;
  logger.log("Generated cache key:", cacheKey);

  const cachedResult: TournamentsRow[] = await redisTools.getCache(cacheKey);
  if (cachedResult) {
    logger.log("Cache hit for key:", cacheKey);
    return cachedResult;
  }
  logger.log("Cache miss for key:", cacheKey);

  const result = await db
    .select()
    .from(tournaments)
    .where(or(...ids.map((id) => eq(tournaments.id, id))))
    .execute();
  logger.log("Executed query; rows returned:", result.length);

  // Cache the result
  await redisTools.setCache(cacheKey, result, redisTools.cacheLvl.guard);
  logger.log("Result cached for key:", cacheKey);

  return result;
};

export const insertTournamentTx = async (
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  data: TournamentsRowInsert
) => {
  const [inserted] = await tx.insert(tournaments).values(data).returning().execute();
  return inserted;
};

export const getTournamentsWithFiltersDB = async ({
  limit,
  cursor,
  filter,
  sortBy,
  sortOrder,
}: {
  limit: number;
  cursor: number | null;
  filter?: {
    tournamentState?: "Active" | "Concluded" | "TonAddressPending";
    entryType?: "Tickets" | "Pass";
    status?: "ongoing" | "upcoming" | "ended" | "notended";
    gameId?: number;
  };
  sortBy: "prize" | "entryFee" | "timeRemaining";
  sortOrder: "asc" | "desc";
}) => {
  // Generate cache key based on input parameters
  const cacheParams = { limit, cursor, filter, sortBy, sortOrder };
  const hash = crypto.createHash("md5").update(JSON.stringify(cacheParams)).digest("hex");
  const cacheKey = redisTools.cacheKeys.getTournamentsWithFilters + hash;
  // Check and return cached result if available
  const cachedResult: TournamentsRow[] = await redisTools.getCache(cacheKey);
  if (cachedResult) return cachedResult;

  let query = db.select().from(tournaments);

  // Gather filters into an array instead of calling where repeatedly
  const conditions = [];
  if (filter?.tournamentState) {
    conditions.push(eq(tournaments.state, filter.tournamentState));
  }
  if (filter?.entryType) {
    conditions.push(eq(tournaments.tonEntryType, filter.entryType));
  }
  if (filter?.status) {
    const now = new Date();
    if (filter.status === "ongoing") {
      conditions.push(lte(tournaments.startDate, now));
      conditions.push(gte(tournaments.endDate, now));
    } else if (filter.status === "upcoming") {
      conditions.push(gt(tournaments.startDate, now));
    } else if (filter.status === "ended") {
      conditions.push(lt(tournaments.endDate, now));
    } else if (filter.status === "notended") {
      conditions.push(gte(tournaments.endDate, now));
    }
  }
  if (filter?.gameId && filter.gameId !== -1) {
    conditions.push(eq(tournaments.gameId, filter.gameId));
  }
  if (conditions.length > 0) {
    query.where(and(...conditions));
  }
  // Apply sorting based on sortBy
  if (sortBy === "prize") {
    query.orderBy(sortOrder === "asc" ? asc(tournaments.currentPrizePool) : desc(tournaments.currentPrizePool));
  } else if (sortBy === "entryFee") {
    query.orderBy(sortOrder === "asc" ? asc(tournaments.entryFee) : desc(tournaments.entryFee));
  } else if (sortBy === "timeRemaining") {
    query.orderBy(sortOrder === "asc" ? asc(tournaments.endDate) : desc(tournaments.endDate));
  }
  // Use cursor as an offset for simplicity
  const offset = cursor ?? 0;
  query.limit(limit).offset(offset);
  // Execute the query and cache the result
  const result = await query.execute();
  await redisTools.setCache(cacheKey, result, redisTools.cacheLvl.guard);
  return result;
};

/**
 * Retrieves all tournaments whose endDate >= cutoffDate,
 * along with the associated game, via INNER JOIN.
 */
export const getTournamentsEndingAfter = async (cutoffDate: Date) => {
  return db
    .select({
      tournaments: {
        id: tournaments.id,
        hostTournamentId: tournaments.hostTournamentId,
        endDate: tournaments.endDate,
      },
      game: {
        id: games.id,
        hostGameId: games.hostGameId,
        name: games.name,
      },
    })
    .from(tournaments)
    .innerJoin(games, eq(tournaments.gameId, games.id))
    .where(gte(tournaments.endDate, cutoffDate))
    .execute();
};

export const updateTournamentTx = async (
  trx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  tournamentId: number,
  updatedFields: any
) => {
  const result = (
    await trx.update(tournaments).set(updatedFields).where(eq(tournaments.id, tournamentId)).returning().execute()
  ).pop();
  await redisTools.deleteCache(getTournamentCacheKey(tournamentId));
  return result;
};

export const tournamentsDB = {
  addTournament,
  getTournamentById,
  insertTournamentTx,
  getTournamentsWithFiltersDB,
  getTournamentsEndingAfter,
  updateTournamentTx,
  updateActivityIdTrx,
  getTournamentsByIds, // added new function to the exported object
};
