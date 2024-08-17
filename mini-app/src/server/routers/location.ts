import { db } from "@/db/db";
import { giataCity } from "@/db/schema";
import { and, eq, ilike, SQLWrapper } from "drizzle-orm";
import { z } from "zod";
import { publicProcedure, router } from "../trpc";

export const locationRouter = router({
  getCountries: publicProcedure
    .input(
      z.object({
        search: z.string().optional(),
      })
    )
    .query(async (opts) => {
      const whereOptions: SQLWrapper[] = [eq(giataCity.parentId, 0)];

      if (opts.input.search) {
        whereOptions.push(ilike(giataCity.title, `%${opts.input.search}%`));
      }

      return await db
        .select()
        .from(giataCity)
        .where(and(...whereOptions))
        .execute();
    }),

  getCities: publicProcedure
    .input(z.object({ countryId: z.number(), search: z.string().optional() }))
    .query(async (opts) => {
      const whereOptions: SQLWrapper[] = [
        eq(giataCity.parentId, opts.input.countryId),
      ];

      if (opts.input.search) {
        whereOptions.push(ilike(giataCity.title, `%${opts.input.search}%`));
      }

      return await db
        .select()
        .from(giataCity)
        .where(and(...whereOptions))
        .execute();
    }),
});
