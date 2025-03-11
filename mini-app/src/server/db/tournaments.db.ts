import { db } from "@/db/db";
import { tournaments, TournamentsRow, TournamentsRowInsert } from "@/db/schema/tournaments";
import { redisTools } from "@/lib/redisTools";
import { logger } from "@/server/utils/logger";
import crypto from "crypto";
import { and, asc, desc, eq } from "drizzle-orm";

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
 * Fetch a tournament by its local primary key (tournaments.id).
 * Returns a TournamentsRow or undefined if not found.
 */
export const getTournamentById = async (tournamentId: number): Promise<TournamentsRow | undefined> => {
  const cacheKey = redisTools.cacheKeys.getTournamentById + tournamentId;
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

  query.where(
    and(
      filter?.tournamentState ? eq(tournaments.state, filter.tournamentState) : undefined,
      filter?.entryType ? eq(tournaments.tonEntryType, filter.entryType) : undefined
    )
  );

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
 * Optional: Add more methods, e.g. getTournamentByHostTournamentId, updateTournament, etc.
 */

export const tournamentsDB = {
  addTournament,
  getTournamentById,
  insertTournamentTx,
  getTournamentsWithFiltersDB,
};
