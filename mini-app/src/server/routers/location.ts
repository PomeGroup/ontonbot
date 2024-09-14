import { db } from "@/db/db";
import { giataCity } from "@/db/schema";
import { and, eq, ilike, sql, SQLWrapper } from "drizzle-orm";
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

      let query = db
        .select()
        .from(giataCity)
        .where(and(...whereOptions));

      if (opts.input.search) {
        // @ts-expect-error
        query = query.orderBy(
          sql`similarity(${giataCity.title}, ${opts.input.search}) DESC`
        );
      }

      return await query.limit(7).execute();
    }),
  getCityById: publicProcedure
    .input(z.object({ cityId: z.number() }))
    .query(async (opts) => {
      return await db
        .select()
        .from(giataCity)
        .where(eq(giataCity.id, opts.input.cityId))
        .limit(1)
        .execute()
        .then((results) => results[0]);
    }),
});
