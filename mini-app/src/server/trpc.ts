import { db } from "@/db/db";
import { validateMiniAppData } from "@/utils";
import { TRPCError, initTRPC } from "@trpc/server";
import { z } from "zod";

const t = initTRPC.create();

export const router = t.router;

export const publicProcedure = t.procedure;

// protected using initdata
export const initDataProtectedProcedure = t.procedure
  .input(z.object({ init_data: z.string() }))
  .use(async (opts) => {
    const initData = opts.input.init_data;

    if (!initData) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "No init_data provided",
      });
    }

    const { valid, initDataJson } = validateMiniAppData(initData);

    if (!valid) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "invalid init_data",
      });
    }

    const user = await db.query.users.findFirst({
      where(fields, { eq }) {
        return eq(fields.user_id, initDataJson.user.id);
      },
    });

    if (!user) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "user not found while authentication",
      });
    }

    return opts.next({
      ctx: {
        parsedInitData: initDataJson,
        user,
      },
    });
  });
