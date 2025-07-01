// db/modules/eventMerchRaffleResults.db.ts
import { db } from "@/db/db";
import { eventMerchRaffleResults, merchResultStatus } from "@/db/schema/eventMerchRaffleResults";
import { eventMerchRaffles } from "@/db/schema/eventMerchRaffles";
import { users } from "@/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import eventMerchRafflesDB from "./eventMerchRaffles.db";
import { InferSelectModel } from "drizzle-orm";

/* ------------------------------------------------------------------ */
/*                          TYPE EXPORTS                              */
/* ------------------------------------------------------------------ */
export type MerchResultRow = InferSelectModel<typeof eventMerchRaffleResults>;
export type MerchResultStatusType = (typeof merchResultStatus.enumValues)[number];

/* ------------------------------------------------------------------ */
/*                        BASIC INSERT                                */
/* ------------------------------------------------------------------ */
export const addUserScore = async (params: { merch_raffle_id: number; user_id: number; score: number }) =>
  db.insert(eventMerchRaffleResults).values(params).onConflictDoNothing().execute();

/* ------------------------------------------------------------------ */
/*                    RANK & ELIGIBILITY HELPERS                      */
/* ------------------------------------------------------------------ */
export const computeTopN = async (
  merchRaffleId: number,
  topN?: number // optional override
) => {
  /* always load the parent row so we have both top_n and need_shipping */
  const parent = (
    await db
      .select({
        top_n: eventMerchRaffles.top_n,
        need_shipping: eventMerchRaffles.need_shipping,
      })
      .from(eventMerchRaffles)
      .where(eq(eventMerchRaffles.merch_raffle_id, merchRaffleId))
      .limit(1)
  ).pop();

  if (!parent) throw new Error("Merch raffle not found");

  const useTopN = topN ?? parent.top_n ?? 1;
  const needShipping = parent.need_shipping;

  const rows = await db
    .select()
    .from(eventMerchRaffleResults)
    .where(eq(eventMerchRaffleResults.merch_raffle_id, merchRaffleId))
    .orderBy(desc(eventMerchRaffleResults.score), eventMerchRaffleResults.id)
    .execute();

  for (let i = 0; i < rows.length; i++) {
    const rank = i + 1;
    await db
      .update(eventMerchRaffleResults)
      .set({
        rank,
        status: rank <= useTopN ? (needShipping ? "awaiting_address" : "awaiting_pickup") : "pending",
      })
      .where(eq(eventMerchRaffleResults.id, rows[i].id))
      .execute();
  }
};

/* ------------------------------------------------------------------ */
/*              SHIPPING / PICKUP STATE TRANSITIONS                   */
/* ------------------------------------------------------------------ */
export const saveShippingAddress = (id: number, fields: { full_name: string; shipping_address: string; phone?: string }) =>
  db
    .update(eventMerchRaffleResults)
    .set({ ...fields, status: "awaiting_pickup", updated_at: new Date() })
    .where(eq(eventMerchRaffleResults.id, id))
    .execute();

export const markShipped = (id: number, trackingNumber: string | null = null) =>
  db
    .update(eventMerchRaffleResults)
    .set({
      status: "shipped",
      tracking_number: trackingNumber ?? undefined,
      shipped_at: new Date(),
    })
    .where(eq(eventMerchRaffleResults.id, id))
    .execute();

export const markDelivered = (id: number) =>
  db
    .update(eventMerchRaffleResults)
    .set({ status: "delivered", delivered_at: new Date() })
    .where(eq(eventMerchRaffleResults.id, id))
    .execute();

export const markCollected = (id: number) =>
  db
    .update(eventMerchRaffleResults)
    .set({ status: "collected", collected_at: new Date() })
    .where(eq(eventMerchRaffleResults.id, id))
    .execute();

/* bulk helpers */
export const markManyFailed = (ids: number[]) =>
  db.update(eventMerchRaffleResults).set({ status: "failed" }).where(inArray(eventMerchRaffleResults.id, ids)).execute();

/* ------------------------------------------------------------------ */
/*                             QUERIES                               */
/* ------------------------------------------------------------------ */
export const listAwaitingAddress = (merchRaffleId: number) =>
  db
    .select()
    .from(eventMerchRaffleResults)
    .where(
      and(eq(eventMerchRaffleResults.merch_raffle_id, merchRaffleId), eq(eventMerchRaffleResults.status, "awaiting_address"))
    )
    .execute();

export const fetchUserResult = async (merch_raffle_uuid: string, user_id: number) => {
  const merch = await eventMerchRafflesDB.fetchMerchRaffleByUuid(merch_raffle_uuid);
  if (!merch) return null;

  return (
    await db
      .select()
      .from(eventMerchRaffleResults)
      .where(
        and(eq(eventMerchRaffleResults.merch_raffle_id, merch.merch_raffle_id), eq(eventMerchRaffleResults.user_id, user_id))
      )
  ).pop();
};

export const getUserView = async (merch_raffle_uuid: string, user_id: number) => {
  /* parent row */
  const merch = await eventMerchRafflesDB.fetchMerchRaffleByUuid(merch_raffle_uuid);
  if (!merch) return null;

  /* user’s result */
  const my = await fetchUserResult(merch_raffle_uuid, user_id);

  /* winners list (only after distributing/completed) */
  let winners: {
    rank: number | null;
    score: number | null;
    username: string | null;
    first_name: string | null;
    last_name: string | null;
    photo_url: string | null;
    status: MerchResultStatusType;
  }[] = [];

  if (["distributing", "completed"].includes(merch.status)) {
    winners = await db
      .select({
        rank: eventMerchRaffleResults.rank,
        score: eventMerchRaffleResults.score,
        username: users.username,
        first_name: users.first_name,
        last_name: users.last_name,
        photo_url: users.photo_url,
        status: eventMerchRaffleResults.status,
      })
      .from(eventMerchRaffleResults)
      .innerJoin(users, eq(users.user_id, eventMerchRaffleResults.user_id))
      .where(eq(eventMerchRaffleResults.merch_raffle_id, merch.merch_raffle_id))
      .orderBy(eventMerchRaffleResults.rank)
      .execute();
  }

  return { merch, my, winners };
};

const eventMerchRaffleResultsDB = {
  addUserScore,
  computeTopN,
  saveShippingAddress,
  markShipped,
  markDelivered,
  markCollected,
  markManyFailed,
  listAwaitingAddress,
  fetchUserResult,
  getUserView,
};
export default eventMerchRaffleResultsDB;
