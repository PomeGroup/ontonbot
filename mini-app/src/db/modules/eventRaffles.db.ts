import { db } from "@/db/db";
import { eventRaffles, RaffleStatusType } from "@/db/schema/eventRaffles";
import { and, eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { eventRaffleResults, eventWallets, users } from "../schema";
import { fetchTonBalance } from "@/lib/tonBalance";

export const createRaffle = async (eventId: number, topN: number) => {
  const [row] = await db
    .insert(eventRaffles)
    .values({
      raffle_uuid: uuidv4(),
      event_id: eventId,
      top_n: topN,
    })
    .returning();
  return row;
};

export const fetchRaffleByUuid = async (uuid: string) =>
  (await db.select().from(eventRaffles).where(eq(eventRaffles.raffle_uuid, uuid))).pop();

export const fetchRaffleByEvent = async (eventId: number) =>
  (await db.select().from(eventRaffles).where(eq(eventRaffles.event_id, eventId))).pop();

export const setRaffleStatus = async (raffleId: number, status: RaffleStatusType) =>
  db.update(eventRaffles).set({ status }).where(eq(eventRaffles.raffle_id, raffleId)).execute();

export const setPrizePool = async (raffleId: number, nanoTon: bigint) =>
  db.update(eventRaffles).set({ prize_pool_nanoton: nanoTon }).where(eq(eventRaffles.raffle_id, raffleId)).execute();

export const getRaffleSummaryForOrganizer = async (raffle_uuid: string) => {
  const raffle = await fetchRaffleByUuid(raffle_uuid);
  if (!raffle) return null;

  /* wallet address & on-chain balance ----------------------------------- */
  const walletRow = await db
    .select({ address: eventWallets.wallet_address })
    .from(eventWallets)
    .where(eq(eventWallets.event_id, raffle.event_id))
    .execute()
    .then((r) => r.pop());

  const onChainBalanceNano: bigint = walletRow?.address
    ? await fetchTonBalance(walletRow.address) // <-- implement HTTP call in infra layer
    : BigInt(0);

  /* eligible users ------------------------------------------------------ */
  const eligibleRows = await db
    .select({
      user_id: eventRaffleResults.user_id,
      username: users.username,
      first_name: users.first_name,
      last_name: users.last_name,
      photo_url: users.photo_url,
      reward_nanoton: eventRaffleResults.reward_nanoton,
      tx_hash: eventRaffleResults.tx_hash,
    })
    .from(eventRaffleResults)
    .innerJoin(users, eq(users.user_id, eventRaffleResults.user_id))
    .where(and(eq(eventRaffleResults.raffle_id, raffle.raffle_id), eq(eventRaffleResults.status, "eligible")))
    .orderBy(eventRaffleResults.rank)
    .execute();

  const eligibleCount = eligibleRows.length;
  const perUserNano =
    raffle.prize_pool_nanoton && raffle.top_n ? raffle.prize_pool_nanoton / BigInt(raffle.top_n) : BigInt(0);

  return {
    raffle,
    wallet: { address: walletRow?.address, balanceNano: onChainBalanceNano },
    eligibleCount,
    perUserNano,
    winners: eligibleRows,
  };
};

/* ------------------------------------------------------------------ */
/*             STATUS UPDATE WHEN ORGANISER PRESSES “TRIGGER”         */
/* ------------------------------------------------------------------ */
export const triggerDistribution = async (raffle_id: number) => setRaffleStatus(raffle_id, "distributing");

export const listByStatus = (status: RaffleStatusType) =>
  db.select().from(eventRaffles).where(eq(eventRaffles.status, status)).execute();

/* CONVENIENCE: complete raffle in one call */
export const completeRaffle = (raffleId: number) => setRaffleStatus(raffleId, "completed");
const eventRafflesDB = {
  createRaffle,
  fetchRaffleByUuid,
  fetchRaffleByEvent,
  setRaffleStatus,
  setPrizePool,
  getRaffleSummaryForOrganizer,
  triggerDistribution,
  listByStatus,
  completeRaffle,
};
export default eventRafflesDB;
