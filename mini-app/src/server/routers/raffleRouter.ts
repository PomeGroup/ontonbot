/* server/trpc/raffleRouter.ts  –  ONE router for both TON + multi-merch  */

import { router, eventManagementProtectedProcedure, initDataProtectedProcedure } from "@/server/trpc";
import { z } from "zod";
import { Address, toNano } from "@ton/ton";
import { randomInt } from "crypto";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import eventRafflesDB from "@/db/modules/eventRaffles.db";
import eventRaffleResultsDB from "@/db/modules/eventRaffleResults.db";
import eventMerchRafflesDB from "@/db/modules/eventMerchRaffles.db";
import eventMerchPrizesDB from "@/db/modules/eventMerchPrizes.db";
import eventMerchPrizeResultsDB from "@/db/modules/eventMerchPrizeResults.db";
import { eventRaffles } from "@/db/schema/eventRaffles";

import { db } from "@/db/db";

import { fetchTonBalance } from "@/lib/tonBalance";
import { CHUNK_SIZE_RAFFLE, DEPLOY_FEE_NANO, EXT_FEE_NANO, INT_FEE_NANO, SAFETY_FLOOR_NANO } from "@/constants";
import eventDB from "@/db/modules/events.db";

export const ensureDateWindowOK = async (eventId: number): Promise<void> => {
  const event = await eventDB.getEventById(eventId);
  if (!event) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
  }

  const now = Date.now(); // ms
  const start = event.start_date * 1_000; // → ms

  /* event not yet started */
  if (now < start) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Raffle not open yet – event starts at ${new Date(start).toISOString()}`,
    });
  }
};

const serialise = (row: typeof eventRaffles.$inferSelect) => ({
  ...row,
  prize_pool_nanoton: row.prize_pool_nanoton ? row.prize_pool_nanoton.toString() : null,
});

/* ───────── router ───────── */
export const raffleRouter = router({
  /* ───────────────── TON  ───────────────── */

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
      const kind = ctx.event.raffleKind;
      if (kind === "merch")
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Already using merch raffle",
        });

      const nano = toNano(input.prize_pool_ton.toString());
      const row = await eventRafflesDB.upsert(eventId, input.top_n, nano); // helper you already have
      /* ❷ mark the event the first time */
      if (kind === null) {
        await eventDB.patchEvent(eventId, { raffleKind: "ton" });
      }
      return serialise(row);
    }),

  /* ───────────────── MERCH  –  RAFFLE SHELL ───────────────── */

  ensureMerchRaffle: eventManagementProtectedProcedure
    .input(z.object({ event_uuid: z.string().uuid() }))
    .mutation(async ({ ctx }) => {
      const eventId = ctx.event.event_id;
      const kind = ctx.event.raffleKind;

      if (kind === "ton") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Event already uses TON raffle" });
      }

      /* ❶ create merch raffle directly bound to the event */
      let merch = await eventMerchRafflesDB.fetchByEvent(eventId);
      if (!merch) merch = await eventMerchRafflesDB.createForEvent(eventId);

      /* ❷ mark the event the first time */
      if (kind === null && merch) {
        await eventDB.patchEvent(eventId, { raffleKind: "merch" });
      }
      return merch;
    }),

  /* ───────────────── MERCH  –  PRIZE CRUD ───────────────── */

  saveMerchPrize: eventManagementProtectedProcedure
    .input(
      z.object({
        merch_raffle_uuid: z.string().uuid(),
        merch_prize_id: z.number().optional(), // undefined → create
        item_name: z.string().min(3),
        item_description: z.string().optional(),
        image_url: z.string().url().nullable().optional(),
        top_n: z.number().int().min(1).max(100),
        fulfil_method: z.enum(["ship", "pickup"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const eventId = ctx.event.event_id;
      const kind = ctx.event.raffleKind;

      const raffle = await eventMerchRafflesDB.fetchMerchRaffleByUuid(input.merch_raffle_uuid);
      if (!raffle) throw new TRPCError({ code: "NOT_FOUND" });
      if (kind === "ton") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Event already uses TON raffle" });
      }
      const base = {
        item_name: input.item_name,
        item_description: input.item_description ?? null,
        image_url: input.image_url ?? null,
        top_n: input.top_n,
        fulfil_method: input.fulfil_method,
        need_shipping: input.fulfil_method === "ship",
      };
      /* ❷ mark the event the first time */
      if (kind === null) {
        await eventDB.patchEvent(eventId, { raffleKind: "merch" });
      }
      return input.merch_prize_id
        ? eventMerchPrizesDB.updatePrize(input.merch_prize_id, base)
        : eventMerchPrizesDB.createPrize(raffle.merchRaffleId, base);
    }),

  /* ───────────────── ORGANISER  –  DASHBOARDS ───────────────── */
  infoForOrganizer: eventManagementProtectedProcedure.query(async ({ ctx }) => {
    /* this endpoint is only for TON giveaways */
    if (ctx.event.raffleKind !== "ton") return null;

    /* 1️⃣ TON-raffle row */
    const raffle = await eventRafflesDB.fetchRaffleByEvent(ctx.event.event_id);
    if (!raffle) return null; // nothing defined yet

    /* 2️⃣ DB summary (unchanged) */
    const summary = await eventRafflesDB.getRaffleSummaryForOrganizer(raffle.raffle_uuid);
    if (!summary) throw new TRPCError({ code: "NOT_FOUND", message: "raffle disappeared" });

    /* 3️⃣ live wallet probe */
    let balanceNano = BigInt(0);
    let deployed = true;
    try {
      balanceNano = await fetchTonBalance(summary.wallet.address!);
    } catch {
      deployed = false; // wallet not deployed
    }
    Object.assign(summary.wallet as any, {
      balanceNano: balanceNano.toString(),
      deployed,
    });

    /* 4️⃣ auto-flip status (same logic as before) */
    if (raffle.status !== "distributing" && raffle.status !== "completed") {
      if (deployed) {
        const batches = BigInt(Math.ceil(raffle.top_n / CHUNK_SIZE_RAFFLE));
        const poolNano = BigInt(raffle.prize_pool_nanoton ?? 0);
        const needNano =
          poolNano + EXT_FEE_NANO * batches + INT_FEE_NANO * BigInt(raffle.top_n) + DEPLOY_FEE_NANO + SAFETY_FLOOR_NANO;

        const funded = balanceNano >= needNano;

        if (funded && raffle.status === "waiting_funding") {
          await eventRafflesDB.updateRaffle(raffle.raffle_id, { status: "funded" });
          (summary.raffle as any).status = "funded";
        }
        if (!funded && raffle.status === "funded") {
          await eventRafflesDB.updateRaffle(raffle.raffle_id, { status: "waiting_funding" });
          (summary.raffle as any).status = "waiting_funding";
        }
      } else if (raffle.status === "funded") {
        await eventRafflesDB.updateRaffle(raffle.raffle_id, { status: "waiting_funding" });
        (summary.raffle as any).status = "waiting_funding";
      }
    }

    return summary;
  }),

  /* ───────────────────────── organiser – merch raffle ───────────────────────── */
  infoForOrganizerMerch: eventManagementProtectedProcedure.query(async ({ ctx }) => {
    /* endpoint only valid for merch raffles */
    if (ctx.event.raffleKind !== "merch") return null;

    /* 1️⃣ existing merch-raffle row – DO NOT auto-create */
    const merchRaffle = await eventMerchRafflesDB.fetchByEvent(ctx.event.event_id);
    if (!merchRaffle) return null; // nothing defined yet

    /* 2️⃣ prizes + winners */
    const rawPrizes = await eventMerchPrizesDB.listPrizesForRaffle(merchRaffle.merchRaffleId);
    const prizes = await Promise.all(rawPrizes.map((p) => eventMerchPrizesDB.getPrizeWithWinners(p.merch_prize_id)));

    return { raffle: merchRaffle, prizes };
  }),

  /* ------------------------------------------------------------------ */
  /*  TON giveaway – trigger                                             */
  /* ------------------------------------------------------------------ */
  trigger: eventManagementProtectedProcedure
    .input(z.object({ raffle_uuid: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const raffle = await eventRafflesDB.fetchRaffleByUuid(input.raffle_uuid);
      if (!raffle || raffle.status !== "funded") throw new TRPCError({ code: "BAD_REQUEST" });

      /* <-- use the helper */
      const n = await eventRaffleResultsDB.countParticipantsForRaffle(raffle.raffle_id);
      if (n === 0)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No eligible participants yet",
        });

      await db.transaction(async (tx) => {
        await eventRaffleResultsDB.setEligibilityForRaffle(tx, raffle.raffle_id, raffle.top_n);
        await tx
          .update(eventRaffles)
          .set({ status: "distributing", updated_at: new Date() })
          .where(eq(eventRaffles.raffle_id, raffle.raffle_id));
      });

      return { ok: true };
    }),

  /* ------------------------------------------------------------------ */
  /*  Merch prize – trigger                                              */
  /* ------------------------------------------------------------------ */
  triggerMerchPrize: eventManagementProtectedProcedure
    .input(z.object({ merch_prize_id: z.number() }))
    .mutation(async ({ input }) => {
      const prize = await eventMerchPrizesDB.fetchPrizeById(input.merch_prize_id);
      if (!prize || prize.status !== "draft") throw new TRPCError({ code: "BAD_REQUEST" });

      /* <-- use the helper */
      const n = await eventMerchPrizeResultsDB.countParticipantsForMerchPrize(prize.merch_prize_id);
      if (n === 0)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No eligible participants yet",
        });

      await eventMerchPrizeResultsDB.computeTopN(prize.merch_prize_id);
      await eventMerchPrizesDB.updatePrize(prize.merch_prize_id, {
        status: "distributing",
      });

      return { ok: true };
    }),

  listMerchPrizes: initDataProtectedProcedure
    .input(z.object({ merch_raffle_uuid: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { user } = ctx; // may be null (unauth user in Web-App)
      const raffle = await eventMerchRafflesDB.fetchMerchRaffleByUuid(input.merch_raffle_uuid);
      if (!raffle) throw new TRPCError({ code: "NOT_FOUND" });

      /* all prizes that belong to this merch raffle */
      const prizes = await eventMerchPrizesDB.listPrizesForRaffle(raffle.merchRaffleId);

      /* decorate each prize with: winners[] (only when completed) + my{}  */
      const rows = await Promise.all(
        prizes.map(async (p) => {
          /* winners only after organiser pressed “Pick winners” and distribution finished */
          const winners =
            p.status === "completed"
              ? await eventMerchPrizeResultsDB.getPrizeWithWinners(p.merch_prize_id) // you already have that helper
              : [];

          /* my rank/score/status (if user logged-in & already spun) */
          let my = null;
          if (user) {
            my = await eventMerchPrizeResultsDB.fetchUserRow({ merch_prize_id: p.merch_prize_id, user_id: user.user_id });
          }

          return { prize: p, winners, my };
        })
      );

      return { raffle, prizes: rows };
    }),
  /* ───────────────── TON GIVE-AWAY  (unchanged logic) ───────────────── */
  spinTon: initDataProtectedProcedure
    .input(
      z.object({
        raffle_uuid: z.string().uuid(), // TON-raffle UUID
        wallet_address: z.string().min(36).max(48), // user wallet
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;

      /* 1. load the TON raffle row */
      const raffle = await eventRafflesDB.fetchRaffleByUuid(input.raffle_uuid);
      if (!raffle || ["distributing", "completed"].includes(raffle.status)) throw new TRPCError({ code: "BAD_REQUEST" });

      /* 2. already spun? */
      if (await eventRaffleResultsDB.fetchUserScore(raffle.raffle_id, user.user_id))
        return { alreadyPlayed: true, score: undefined };

      /* 3. event still open? */
      await ensureDateWindowOK(raffle.event_id);

      /* 4. generate + persist score */
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

      /* 5. copy score into *all* merch-prizes of the same event, if any */
      const merchRaffle = await eventMerchRafflesDB.fetchByEvent(raffle.event_id);
      if (merchRaffle) {
        const prizes = await eventMerchPrizesDB.listPrizesForRaffle(merchRaffle.merchRaffleId);

        await Promise.all(
          prizes.map((p) =>
            eventMerchPrizeResultsDB.addUserScore({
              merch_prize_id: p.merch_prize_id,
              user_id: user.user_id,
              score,
            })
          )
        );
      }

      /* 6. recompute TON top-N (merch handled independently) */
      await eventRaffleResultsDB.computeTopN(raffle.raffle_id, raffle.top_n);

      return { alreadyPlayed: false, score };
    }),

  /* ───────────────── MERCH RAFFLE (no wallet needed) ───────────────── */
  spinMerch: initDataProtectedProcedure
    .input(z.object({ merch_raffle_uuid: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;

      /* 1. load merch raffle + its prizes */
      const merch = await eventMerchRafflesDB.fetchMerchRaffleByUuid(input.merch_raffle_uuid);
      if (!merch) throw new TRPCError({ code: "NOT_FOUND" });

      const prizes = await eventMerchPrizesDB.listPrizesForRaffle(merch.merchRaffleId);
      const open = prizes.filter((p) => p.status !== "completed");
      if (!open.length) throw new TRPCError({ code: "BAD_REQUEST", message: "No active prizes" });

      /* 2. already spun?  — test by looking at *one* prize */
      const firstResult = await eventMerchPrizeResultsDB.fetchUserRow({
        merch_prize_id: prizes[0].merch_prize_id,
        user_id: user.user_id,
      });
      if (firstResult) return { alreadyPlayed: true, score: firstResult.score };

      /* 3. event still open? (same helper as TON version) */
      await ensureDateWindowOK(merch.eventId);

      /* 4. generate score & write it for every prize */
      const score = randomInt(1, 1_000_000);

      await Promise.all(
        prizes.map((p) =>
          eventMerchPrizeResultsDB.addUserScore({
            merch_prize_id: p.merch_prize_id,
            user_id: user.user_id,
            score,
          })
        )
      );

      /* 5. recompute ranks for each prize individually */
      await Promise.all(prizes.map((p) => eventMerchPrizeResultsDB.computeTopN(p.merch_prize_id)));

      return { alreadyPlayed: false, score };
    }),
  /* ───────────────── USER VIEWS ───────────────── */

  view: initDataProtectedProcedure
    .input(z.object({ raffle_uuid: z.string().uuid() }))
    .query(({ ctx, input }) => eventRaffleResultsDB.getUserView(input.raffle_uuid, ctx.user.user_id)),

  viewMerchPrize: initDataProtectedProcedure.input(z.object({ merch_prize_id: z.number() })).query(({ ctx, input }) =>
    eventMerchPrizeResultsDB.getPrizeWithWinners(input.merch_prize_id).then((r) => {
      if (!r) throw new TRPCError({ code: "NOT_FOUND", message: "prize missing" });
      return {
        prize: r.prize,
        my: r.winners.find((w) => w.user_id === ctx.user.user_id) ?? null,
      };
    })
  ),
});
