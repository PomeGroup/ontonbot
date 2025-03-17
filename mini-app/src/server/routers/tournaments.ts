// ...import additional operators as needed
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { tournamentsDB } from "../db/tournaments.db";
import { usersDB } from "../db/users";
import { initDataProtectedProcedure, router } from "../trpc";

import { db } from "@/db/db";
import { games } from "@/db/schema";
import { getTournamentLeaderboard } from "@/lib/elympicsApi";
import { cacheKeys, redisTools } from "@/lib/redisTools";
import { selectUserById } from "@/server/db/users";
import { LeaderboardResponse } from "@/types/elympicsAPI.types";
import { GameFilterId, tournamentsListSortOptions } from "../utils/tournaments.utils";

export const tournamentsRouter = router({
  // Updated infinite query with filtering and sorting
  getTournaments: initDataProtectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
        cursor: z.number().nullable().default(null), // treat as offset
        filter: z
          .object({
            tournamentState: z.enum(["Active", "Concluded", "TonAddressPending"]).optional(),
            entryType: z.enum(["Tickets", "Pass"]).optional(),
            status: z.enum(["ongoing", "upcoming", "ended", "notended"]).optional(),
            gameId: z.number().optional(),
          })
          .optional(),
        sortBy: z.enum(tournamentsListSortOptions).default("timeRemaining"),
        sortOrder: z.enum(["asc", "desc"]).default("asc"),
      })
    )
    .query(async ({ input }) => {
      const { limit, cursor, filter, sortBy, sortOrder } = input;

      // Execute query and calculate next cursor value; here using offset pagination
      const tournamentsData = await tournamentsDB.getTournamentsWithFiltersDB({
        limit,
        cursor,
        filter,
        sortBy,
        sortOrder,
      });

      const nextCursor = tournamentsData.length === limit ? cursor || 0 + limit : null;

      return { tournaments: tournamentsData, nextCursor };
    }),

  getGameIds: initDataProtectedProcedure.query(async () => {
    const cachedGameIds = await redisTools.getCache(cacheKeys.gameIds);

    if (cachedGameIds) {
      return cachedGameIds as GameFilterId[];
    }

    const gameIds = await db
      .select({
        id: games.id,
        name: games.name,
      })
      .from(games);

    gameIds.push({
      id: -1,
      name: "All Challenges",
    });

    await redisTools.setCache(cacheKeys.gameIds, gameIds);

    return gameIds;
  }),

  getTournamentById: initDataProtectedProcedure
    .input(
      z.object({
        id: z.number(),
      })
    )
    .query(async ({ input }) => {
      const { id } = input;
      const tournament = await tournamentsDB.getTournamentById(id);
      if (!tournament) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Tournament not found" });
      }
      const tournamentOrganizer = await usersDB.getOrganizerById(tournament.owner);
      return { ...tournament, organizer: tournamentOrganizer.data };
    }),
  /**
   * Get a page of the leaderboard for a specific tournament.
   */
  getTournamentLeaderboard: initDataProtectedProcedure
    .input(
      z.object({
        gameId: z.string().nullable().default(null),
        tournamentId: z.number(),
        limit: z.number().min(1).max(50).default(10),
        cursor: z.number().nullable().default(1),
      })
    )
    .query(async ({ input }) => {
      const { gameId, tournamentId, limit, cursor } = input;

      // 1) Elympics uses 1-based pages, so interpret `cursor` as the current page
      const safeCursor = cursor ?? 1; // if null, default to page 1
      const pageNumber = Math.floor(safeCursor / (limit || 1)) + 1;

      const tournament = await tournamentsDB.getTournamentById(tournamentId);
      if (!tournament) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Tournament not found" });
      }

      // 2) Get the raw leaderboard from Elympics
      const leaderboardResponse: LeaderboardResponse = await getTournamentLeaderboard(
        gameId,
        tournament.hostTournamentId,
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
            firstName = entry.nickname;
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
