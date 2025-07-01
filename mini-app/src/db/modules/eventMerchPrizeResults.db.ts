import { db } from "@/db/db";
import { eventMerchPrizeResults } from "@/db/schema/eventMerchPrizeResults";
import { eventMerchPrizes } from "@/db/schema/eventMerchPrizes";
import { eq, desc, and, sql } from "drizzle-orm";

/* simple insert used by spin-handler */
export const addUserScore = (params: { merch_prize_id: number; user_id: number; score: number }) =>
  db.insert(eventMerchPrizeResults).values(params).onConflictDoNothing();

/* compute ranks + eligibility per *prize* */
export const computeTopN = async (prizeId: number) => {
  const [{ top_n, need_shipping }] = await db
    .select({
      top_n: eventMerchPrizes.top_n,
      need_shipping: eventMerchPrizes.need_shipping,
    })
    .from(eventMerchPrizes)
    .where(eq(eventMerchPrizes.merch_prize_id, prizeId))
    .limit(1);

  const rows = await db
    .select()
    .from(eventMerchPrizeResults)
    .where(eq(eventMerchPrizeResults.merch_prize_id, prizeId))
    .orderBy(desc(eventMerchPrizeResults.score), eventMerchPrizeResults.id)
    .execute();

  for (let i = 0; i < rows.length; i++) {
    const rank = i + 1;
    await db
      .update(eventMerchPrizeResults)
      .set({
        rank,
        status: rank <= top_n ? (need_shipping ? "awaiting_address" : "awaiting_pickup") : "pending",
      })
      .where(eq(eventMerchPrizeResults.id, rows[i].id))
      .execute();
  }
};

export const getPrizeWithWinners = async (prizeId: number) => {
  const [prize] = await db.select().from(eventMerchPrizes).where(eq(eventMerchPrizes.merch_prize_id, prizeId)).limit(1);
  if (!prize) return null;

  const winners = await db
    .select()
    .from(eventMerchPrizeResults)
    .where(eq(eventMerchPrizeResults.merch_prize_id, prizeId))
    .orderBy(eventMerchPrizeResults.rank)
    .execute();

  return { prize, winners };
};
export const fetchUserRow = async (params: { merch_prize_id: number; user_id: number }) => {
  const row = await db
    .select()
    .from(eventMerchPrizeResults)
    .where(
      and(
        eq(eventMerchPrizeResults.merch_prize_id, params.merch_prize_id),
        eq(eventMerchPrizeResults.user_id, params.user_id)
      )
    )

    .limit(1)
    .execute();

  return row[0] || null;
};
/**
 * How many distinct score-rows are recorded for a merch prize?
 * @returns number (0-n)
 */
export const countParticipantsForMerchPrize = async (merchPrizeId: number, tx = db): Promise<number> => {
  const [{ cnt }] = await tx
    .select({ cnt: sql<number>`count(*)` })
    .from(eventMerchPrizeResults)
    .where(eq(eventMerchPrizeResults.merch_prize_id, merchPrizeId));

  return Number(cnt);
};

const eventMerchPrizeResultsDB = {
  addUserScore,
  computeTopN,
  getPrizeWithWinners,
  fetchUserRow,
  countParticipantsForMerchPrize,
};
export default eventMerchPrizeResultsDB;
