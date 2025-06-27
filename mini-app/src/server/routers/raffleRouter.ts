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
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { randomInt } from "crypto";
import { eventRaffles, RaffleStatusType } from "@/db/schema/eventRaffles";
import { CHUNK_SIZE_RAFFLE, DEPLOY_FEE_NANO, EXT_FEE_NANO, INT_FEE_NANO, SAFETY_FLOOR_NANO } from "@/constants";
import { fetchTonBalance } from "@/lib/tonBalance";
import { logger } from "@/server/utils/logger";

function serializeRaffle(row: typeof eventRaffles.$inferSelect) {
  return {
    ...row,
    prize_pool_nanoton: row.prize_pool_nanoton ? row.prize_pool_nanoton.toString() : null,
  };
}
/* -------------------------------------------------------------------------- */
/*                              tRPC Raffle API                               */
/* -------------------------------------------------------------------------- */
export const raffleRouter = router({
  /* 1. DEFINE (organiser) ------------------------------------------------- */
  defineOrUpdate: eventManagementProtectedProcedure
    .input(
      z.object({
        event_uuid: z.string().uuid(),
        top_n: z.number().int().min(1).max(100),
        prize_pool_ton: z.number().positive(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const eventId = ctx.event.event_id;
      const nanoTon = toNano(input.prize_pool_ton.toString());

      const existing = await eventRafflesDB.fetchRaffleByEvent(eventId);

      /* 1) CREATE */
      if (!existing) {
        const raffle = await eventRafflesDB.createRaffle(eventId, input.top_n);
        await eventRafflesDB.setPrizePool(raffle.raffle_id, nanoTon);

        return serializeRaffle(raffle);
      }

      /* 2) UPDATE (allowed while waiting_funding | funded) */
      const allowed = ["waiting_funding", "funded"] as RaffleStatusType[];
      if (!allowed.includes(existing.status as RaffleStatusType)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Raffle already ${existing.status}; cannot modify.`,
        });
      }

      const updated = await eventRafflesDB.updateRaffle(existing.raffle_id, {
        top_n: input.top_n,
        prize_pool_nanoton: nanoTon,
      });

      return serializeRaffle(updated);
    }),

  /* 2. ORGANISER DASHBOARD INFO ------------------------------------------ */
  infoForOrganizer: eventManagementProtectedProcedure.query(async ({ ctx }) => {
    const eventId = ctx.event.event_id;

    /* 1. raffle row ------------------------------------------------ */
    const raffle = await eventRafflesDB.fetchRaffleByEvent(eventId);
    if (!raffle) return null; // nothing yet

    /* 2. DB-level summary ----------------------------------------- */
    const summary = await eventRafflesDB.getRaffleSummaryForOrganizer(raffle.raffle_uuid);
    if (!summary) throw new TRPCError({ code: "NOT_FOUND", message: "raffle disappeared" });

    /* 3. live wallet probe ---------------------------------------- */
    let balanceNano = BigInt(0); // 0 → not deployed
    let deployed = true;

    try {
      balanceNano = await fetchTonBalance(summary.wallet.address!);
    } catch {
      deployed = false; // 404 → not deployed
    }

    (summary.wallet as any).balanceNano = balanceNano.toString();
    (summary.wallet as any).deployed = deployed;

    /* 4. fund-check & *conditional* status flip  ★ ---------------- */
    if (
      raffle.status !== "distributing" && // ← DO NOT touch
      raffle.status !== "completed"
    ) {
      if (deployed) {
        const batches = BigInt(Math.ceil(raffle.top_n / CHUNK_SIZE_RAFFLE));
        const poolNano = BigInt(raffle.prize_pool_nanoton ?? "0");
        const needNano =
          poolNano + EXT_FEE_NANO * batches + INT_FEE_NANO * BigInt(raffle.top_n) + DEPLOY_FEE_NANO + SAFETY_FLOOR_NANO;

        const funded = balanceNano >= needNano;

        // promote
        if (funded && raffle.status === "waiting_funding") {
          await eventRafflesDB.updateRaffle(raffle.raffle_id, { status: "funded" });
          (summary.raffle as any).status = "funded";
        }
        // demote
        if (!funded && raffle.status === "funded") {
          await eventRafflesDB.updateRaffle(raffle.raffle_id, { status: "waiting_funding" });
          (summary.raffle as any).status = "waiting_funding";
        }
      } else if (raffle.status === "funded") {
        /* wallet was never deployed → revert to waiting_funding */
        await eventRafflesDB.updateRaffle(raffle.raffle_id, { status: "waiting_funding" });
        (summary.raffle as any).status = "waiting_funding";
      }
    }

    return summary;
  }),
  /* 3. TRIGGER DISTRIBUTION ---------------------------------------------- */
  trigger: eventManagementProtectedProcedure
    .input(z.object({ raffle_uuid: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const raffle = await eventRafflesDB.fetchRaffleByUuid(input.raffle_uuid);
      if (!raffle) throw new TRPCError({ code: "NOT_FOUND", message: "raffle not found" });
      if (raffle.status !== "funded") throw new TRPCError({ code: "BAD_REQUEST", message: "raffle not funded yet" });

      /* everything atomically */
      await db.transaction(async (tx) => {
        await eventRaffleResultsDB.setEligibilityForRaffle(tx, raffle.raffle_id, raffle.top_n);

        await tx
          .update(eventRaffles)
          .set({ status: "distributing", updated_at: new Date() })
          .where(eq(eventRaffles.raffle_id, raffle.raffle_id))
          .execute();
      });

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
    if (!data) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "raffle not found",
      });
    }
    return data;
  }),
});
