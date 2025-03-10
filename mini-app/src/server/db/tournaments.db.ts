import { db } from "@/db/db";
import { eq } from "drizzle-orm";
import { logger } from "@/server/utils/logger";
import { tournaments, TournamentsRow, TournamentsRowInsert } from "@/db/schema/tournaments";

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
  try {
    const [row] = await db.select().from(tournaments).where(eq(tournaments.id, tournamentId)).execute();

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
/**
 * Optional: Add more methods, e.g. getTournamentByHostTournamentId, updateTournament, etc.
 */

export const tournamentsDB = {
  addTournament,
  getTournamentById,
  insertTournamentTx,
};
