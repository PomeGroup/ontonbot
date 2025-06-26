import {
  router,
  adminOrganizerProtectedProcedure,
  eventManagementProtectedProcedure,
  initDataProtectedProcedure,
} from "@/server/trpc";
import { z } from "zod";
import { toNano } from "@ton/ton";
import eventRafflesDB from "@/db/modules/eventRaffles.db";
import eventRaffleResultsDB from "@/db/modules/eventRaffleResults.db";
import { db } from "@/db/db";
import { eq, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { randomInt } from "crypto";

/* -------------------------------------------------------------------------- */
/*                              tRPC Raffle API                               */
/* -------------------------------------------------------------------------- */
export const raffleRouter = router({
  /* 1. DEFINE (organiser) ------------------------------------------------- */
  define: eventManagementProtectedProcedure
    .input(
      z.object({
        event_uuid: z.string().uuid(),
        top_n: z.number().int().min(1).max(100),
        prize_pool_ton: z.number().positive(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const eventId = ctx.event.event_id;
      const nanoTon = toNano(input.prize_pool_ton.toString()); // convert TON → nano

      const existing = await eventRafflesDB.fetchRaffleByEvent(eventId);
      if (existing)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Raffle already defined for this event",
        });

      const raffle = await eventRafflesDB.createRaffle(eventId, input.top_n);
      await eventRafflesDB.setPrizePool(raffle.raffle_id, nanoTon);
      return raffle;
    }),

  /* 2. ORGANISER DASHBOARD INFO ------------------------------------------ */
  infoForOrganizer: eventManagementProtectedProcedure
    .input(z.object({ raffle_uuid: z.string().uuid() }))
    .query(async ({ input }) => {
      const summary = await eventRafflesDB.getRaffleSummaryForOrganizer(input.raffle_uuid);
      if (!summary) throw new TRPCError({ code: "NOT_FOUND", message: "raffle not found" });
      return summary;
    }),

  /* 3. TRIGGER DISTRIBUTION ---------------------------------------------- */
  trigger: eventManagementProtectedProcedure
    .input(z.object({ raffle_uuid: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const raffle = await eventRafflesDB.fetchRaffleByUuid(input.raffle_uuid);
      if (!raffle) throw new TRPCError({ code: "NOT_FOUND", message: "raffle not found" });

      if (raffle.status !== "funded")
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "raffle not funded yet",
        });

      await eventRafflesDB.triggerDistribution(raffle.raffle_id);
      return { ok: true };
    }),

  /* 4. USER → SPIN THE RAFFLE -------------------------------------------- */
  spin: initDataProtectedProcedure
    .input(
      z.object({
        raffle_uuid: z.string().uuid(),
        wallet_address: z.string().min(36).max(48), // TON addr
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;
      const raffle = await eventRafflesDB.fetchRaffleByUuid(input.raffle_uuid);
      if (!raffle) throw new TRPCError({ code: "NOT_FOUND", message: "raffle not found" });

      if (["distributing", "completed"].includes(raffle.status))
        throw new TRPCError({ code: "BAD_REQUEST", message: "raffle closed" });

      // event must not have ended
      const eventRow = await db.query.events.findFirst({
        where: (fields) => eq(fields.event_id, raffle.event_id),
      });

      if (!eventRow) throw new TRPCError({ code: "NOT_FOUND", message: "event not found" });
      if (!eventRow.enabled) throw new TRPCError({ code: "BAD_REQUEST", message: "event not enabled" });
      if (!eventRow.activity_id) throw new TRPCError({ code: "BAD_REQUEST", message: "event not associated with activity" });

      const nowSec = Math.floor(Date.now() / 1000);
      if (eventRow && nowSec > Number(eventRow.end_date))
        throw new TRPCError({ code: "BAD_REQUEST", message: "event ended" });

      // insert score once
      const score = randomInt(1, 1_000_000);
      await eventRaffleResultsDB.addUserScore({
        raffle_id: raffle.raffle_id,
        user_id: user.user_id,
        score,
        wallet_address: input.wallet_address,
      });

      // recompute ranking
      await eventRaffleResultsDB.computeTopN(raffle.raffle_id, raffle.top_n);

      return { score };
    }),

  /* 5. USER VIEW ---------------------------------------------------------- */
  view: initDataProtectedProcedure.input(z.object({ raffle_uuid: z.string().uuid() })).query(async ({ ctx, input }) => {
    const data = await eventRaffleResultsDB.getUserView(input.raffle_uuid, ctx.user.user_id);
    if (!data) throw new TRPCError({ code: "NOT_FOUND", message: "raffle not found" });
    return data;
  }),
});
