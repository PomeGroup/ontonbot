import { z } from "zod";
import { initDataProtectedProcedure, router } from "../trpc";

import { getTournamentLeaderboard, LeaderboardResponse } from "@/lib/elympicsApi";

export const leaderboardRouter = router({
  /**
   * Get a page of the leaderboard for a specific tournament.
   */
  getTournamentLeaderboardPage: initDataProtectedProcedure
    .input(
      z.object({
        gameId: z.string(), // or z.string().uuid() if guaranteed
        tournamentId: z.string(), // or z.string().uuid()
        limit: z.number().min(1).max(50).default(10),
        cursor: z.number().nullable().default(null), // treat as offset
      })
    )
    .query(async ({ input }) => {
      const { gameId, tournamentId, limit, cursor } = input;

      // 1. Fetch full leaderboard data from your Elympics function
      const fullLeaderboard: LeaderboardResponse = await getTournamentLeaderboard(gameId, tournamentId);

      // 2. We'll slice the data in-memory to simulate pagination.
      //    The official Elympics endpoint doesn't support native pagination as of now.
      const startIndex = cursor ?? 0;
      const endIndex = startIndex + limit;

      // fullLeaderboard.data is an array of leaderboard entries
      const pageData = fullLeaderboard.data.slice(startIndex, endIndex);

      // 3. If there's more data after endIndex, set nextCursor to endIndex
      let nextCursor: number | null = null;
      if (endIndex < fullLeaderboard.data.length) {
        nextCursor = endIndex;
      }

      return {
        leaderboard: pageData,
        nextCursor,
        totalRecords: fullLeaderboard.data.length,
      };
    }),
});
