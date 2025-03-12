import { z } from "zod";
import { initDataProtectedProcedure, router } from "../trpc";

import { getTournamentLeaderboard } from "@/lib/elympicsApi";
import { LeaderboardResponse } from "@/types/elympicsAPI.types";
import { selectUserById } from "@/server/db/users";

export const leaderboardRouter = router({
  /**
   * Get a page of the leaderboard for a specific tournament.
   */
  getTournamentLeaderboard: initDataProtectedProcedure
    .input(
      z.object({
        gameId: z.string().nullable().default(null),
        tournamentId: z.string(),
        limit: z.number().min(1).max(50).default(10),
        cursor: z.number().nullable().default(1),
      })
    )
    .query(async ({ input }) => {
      const { gameId, tournamentId, limit, cursor } = input;

      // 1) Elympics uses 1-based pages, so interpret `cursor` as the current page
      const safeCursor = cursor ?? 1; // if null, default to page 1
      const pageNumber = Math.floor(safeCursor / (limit || 1)) + 1;

      // 2) Get the raw leaderboard from Elympics
      const leaderboardResponse: LeaderboardResponse = await getTournamentLeaderboard(
        gameId,
        tournamentId,
        limit,
        pageNumber
      );

      // 3) Calculate nextCursor if not on the last page
      let nextCursor: number | null = null;
      if (pageNumber < leaderboardResponse.totalPages) {
        nextCursor = leaderboardResponse.data.length * pageNumber + 1;
      }

      // 4) For each leaderboard entry, fetch the local user from DB (or cache).
      //    Then apply the rules for “Ghost user” and “Unknown user.”
      const enrichedLeaderboard = await Promise.all(
        leaderboardResponse.data.map(async (entry) => {
          // In your schema, `telegramId` is a string; assume it’s the same as `users.user_id`
          // If your local user_id is the same as the Elympics `telegramId`, parse it:
          const telegramIdAsNumber = parseInt(entry.telegramId, 10);

          const localUser = await selectUserById(telegramIdAsNumber);

          let firstName: string;
          let photoUrl: string | null = null;
          let localTelegramId = entry.telegramId; // fallback if user not found

          if (!localUser) {
            // User not found -> Ghost user
            firstName = "Ghost user";
          } else {
            // Found user in DB
            firstName = localUser.first_name || "Unknown user";
            photoUrl = localUser.photo_url ?? null;
            localTelegramId = String(localUser.user_id);
          }

          // Return only the fields you want from user + keep leaderboard fields
          return {
            ...entry,
            telegramId: localTelegramId, // Overwrite the telegramId if found
            first_name: firstName,
            photo_url: photoUrl,
          };
        })
      );

      // 5) Return the final paginated result
      return {
        leaderboard: enrichedLeaderboard,
        pageNumber: leaderboardResponse.pageNumber,
        pageSize: leaderboardResponse.pageSize,
        totalPages: leaderboardResponse.totalPages,
        totalRecords: leaderboardResponse.totalRecords,
        nextCursor,
      };
    }),
});
