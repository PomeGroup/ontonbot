import {
  router,
  adminOrganizerProtectedProcedure,
  eventManagementProtectedProcedure,
  initDataProtectedProcedure,
} from "@/server/trpc";
import { z } from "zod";
import { Address, toNano } from "@ton/ton";
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
        wallet_address: z.string().min(36).max(48),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;

      /* ── 1. look up raffle & validate state ─────────────────────────── */
      const raffle = await eventRafflesDB.fetchRaffleByUuid(input.raffle_uuid);
      if (!raffle) throw new TRPCError({ code: "NOT_FOUND", message: "raffle not found" });
      if (["distributing", "completed"].includes(raffle.status))
        throw new TRPCError({ code: "BAD_REQUEST", message: "raffle closed" });

      /* ── 2. has this user already spun? ─────────────────────────────── */
      const existing = await eventRaffleResultsDB.fetchUserScore(raffle.raffle_id, user.user_id);
      if (existing) {
        return { score: existing.score, alreadyPlayed: true };
      }

      /* ── 3. check event & timing ────────────────────────────────────── */
      const eventRow = await db.query.events.findFirst({
        where: (f) => eq(f.event_id, raffle.event_id),
      });
      if (!eventRow) throw new TRPCError({ code: "NOT_FOUND", message: "event not found" });
      if (!eventRow.enabled) throw new TRPCError({ code: "BAD_REQUEST", message: "event not enabled" });
      if (!eventRow.activity_id) throw new TRPCError({ code: "BAD_REQUEST", message: "event not associated with activity" });
      if (Date.now() / 1000 > Number(eventRow.end_date))
        throw new TRPCError({ code: "BAD_REQUEST", message: "event ended" });

      /* ── 4. generate score & insert row ─────────────────────────────── */
      const score = randomInt(1, 1_000_000);
      const addrRaw = (() => {
        const p = Address.parse(input.wallet_address);
        return `${p.workChain}:${p.hash.toString("hex")}`;
      })();

      await eventRaffleResultsDB.addUserScore({
        raffle_id: raffle.raffle_id,
        user_id: user.user_id,
        score,
        wallet_address: addrRaw,
      });

      await eventRaffleResultsDB.computeTopN(raffle.raffle_id, raffle.top_n);

      return { score, alreadyPlayed: false };
    }),

  /* 5. USER VIEW ---------------------------------------------------------- */
  view: initDataProtectedProcedure.input(z.object({ raffle_uuid: z.string().uuid() })).query(async ({ ctx, input }) => {
    const data = await eventRaffleResultsDB.getUserView(input.raffle_uuid, ctx.user.user_id);
    if (!data) throw new TRPCError({ code: "NOT_FOUND", message: "raffle not found" });
    return data;
  }),
});
