import { TRPCError } from "@trpc/server";
import { initDataProtectedProcedure, publicProcedure, router } from "../trpc";
import { db } from "@/db/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const UserEventPointSchema = z.object({
  event_type: z.enum(["in_person", "online"]),
  is_paid: z.boolean(),
});

export const pointsrRouter = router({
  getUserPoint: initDataProtectedProcedure.input({}).mutation(async (opts) => {
    const user_id = opts.ctx.user.user_id;
    const point = await db.query.users.findFirst({
      where: eq(users.user_id, user_id),
      columns: {
        user_point: true,
      },
    });

    return point?.user_point;
  }),

  getUserEventPoint: initDataProtectedProcedure.input(UserEventPointSchema).mutation(async (opts) => {
    const user_id = opts.ctx.user.user_id;
    const point = await db.query.users.findFirst({
      where: eq(users.user_id, user_id),
      columns: {
        user_point: true,
      },
    });
    //i'll do it
    return {
      count: 1,
      point: 100,
    };
  }),
});
