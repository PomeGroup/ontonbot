import { z } from "zod";
import { initDataProtectedProcedure, router } from "../trpc";

import { getTournamentLeaderboard } from "@/lib/elympicsApi";
import { LeaderboardResponse } from "@/types/elympicsAPI.types";

export const leaderboardRouter = router({
  /**
   * Get a page of the leaderboard for a specific tournament.
   */
  getTournamentLeaderboard: initDataProtectedProcedure
    .input(
      z.object({
        // If your Elympics requires gameId, set it as string; if optional, do .nullable() with default(null)
        gameId: z.string().nullable().default(null),
        tournamentId: z.string(),
        limit: z.number().min(1).max(50).default(10), // pageSize
        cursor: z.number().nullable().default(1), // pageNumber
      })
    )
    .query(async ({ input }) => {
      const { gameId, tournamentId, limit, cursor } = input;

      // 1) Elympics is 1-based paging, so treat 'cursor' as the current page number (default = 1)
      const safeCursor = cursor ?? 0; // if null, become 0
      const pageNumber = Math.floor(safeCursor / (limit ?? 1)) + 1;

      // 2) Get that page from Elympics
      const leaderboardResponse: LeaderboardResponse = await getTournamentLeaderboard(
        gameId,
        tournamentId,
        limit,
        pageNumber
      );

      // 3) If the Elympics response says totalPages is, for example, 5,
      //    and you're currently on pageNumber=2, then nextCursor=3
      let nextCursor: number | null = null;
      if (pageNumber < leaderboardResponse.totalPages) {
        nextCursor = leaderboardResponse.data.length * pageNumber + 1;
      }

      // 4) Return the "paged" results
      //    Elympics already returns data for just this page
      return {
        leaderboard: leaderboardResponse.data, // current page's data
        pageNumber: leaderboardResponse.pageNumber, // or pageNumber
        pageSize: leaderboardResponse.pageSize, // or limit
        totalPages: leaderboardResponse.totalPages,
        totalRecords: leaderboardResponse.totalRecords,
        nextCursor,
      };
    }),
});
