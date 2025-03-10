import { db } from "@/db/db";
import { eq } from "drizzle-orm";
import { logger } from "@/server/utils/logger";
import { games, GamesRow, GamesRowInsert } from "@/db/schema/games";

/**
 * Insert a new row in the 'games' table.
 * Returns the inserted row (GamesRow) or undefined if none.
 */
export const addGame = async (gameData: GamesRowInsert): Promise<GamesRow | undefined> => {
  try {
    const [inserted] = await db.insert(games).values(gameData).returning().execute();

    if (inserted) {
      logger.log("Game inserted:", inserted);
      return inserted;
    }
    return undefined;
  } catch (error) {
    logger.error("Error inserting game:", error);
    throw error;
  }
};

/**
 * Fetch a game by its local primary key (games.id).
 * Returns a GamesRow or undefined if not found.
 */
export const getGameById = async (gameId: number): Promise<GamesRow | undefined> => {
  try {
    const [row] = await db.select().from(games).where(eq(games.id, gameId)).execute();

    return row;
  } catch (error) {
    logger.error("Error getting game by ID:", error);
    throw error;
  }
};

/**
 * Optional: Add more CRUD methods, e.g. getGameByHostGameId, updateGame, etc.
 */

export const gamesDB = {
  addGame,
  getGameById,
};
