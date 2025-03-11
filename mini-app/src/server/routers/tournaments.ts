// ...import additional operators as needed
import { z } from "zod";
import { tournamentsDB } from "../db/tournaments.db";
import { initDataProtectedProcedure, router } from "../trpc";

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
          })
          .optional(),
        sortBy: z.enum(["prize", "entryFee", "timeRemaining"]).default("timeRemaining"),
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
  // ...existing code...
});
