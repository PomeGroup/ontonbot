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

export const adminOrganizerProtectedProcedure = initDataProtectedProcedure.use(
  (opts) => {
    if (opts.ctx.user.role !== "admin" && opts.ctx.user.role !== "organizer") {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Unauthorized access, invalid role",
      });
    }

    return opts.next({
      ctx: {
        ...opts.ctx,
        userRole: opts.ctx.user.role as "admin" | "organizer",
      },
    });
  }
);

export const eventManagementProtectedProcedure =
  adminOrganizerProtectedProcedure
    .input(z.object({ event_uuid: z.string().uuid() }))
    .use(async (opts) => {
      const event = await db.query.events.findFirst({
        where: (fields, { eq }) => {
          return eq(fields.event_uuid, opts.input.event_uuid);
        },
      });

      if (!event) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "event not found",
        });
      }

      // check if the user is the owner of the event
      if (
        opts.ctx.userRole === "organizer" &&
        event.owner !== opts.ctx.user.user_id
      ) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Unauthorized access, you don't have access to this event",
        });
      }

      return opts.next({
        ctx: {
          ...opts.ctx,
          event,
        },
      });
    });
