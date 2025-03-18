import { db } from "@/db/db";
import { tournaments } from "@/db/schema/tournaments";
import { gameLeaderboard } from "@/db/schema/gameLeaderboard";
import { eq, and, gt, lt } from "drizzle-orm/expressions";
import { inArray, isNull, sql } from "drizzle-orm";
import { getTournamentLeaderboard } from "@/lib/elympicsApi"; // <-- your existing function
import { logger } from "@/server/utils/logger";
import axios, { AxiosError } from "axios";
import FormData from "form-data";
import { games, users } from "@/db/schema";
import { sleep } from "@/utils";

interface GamerData {
  telegramId: number;
  userId: string;
  nickname?: string;
  position: number;
  points: number;
  matchId: string;
  endedAt: string;
}

/**
 * 1) A helper that returns tournaments whose endDate is
 * between 5 minutes ago and 30 minutes ago
 */
async function getJustEndedTournaments(): Promise<
  {
    id: number;
    gameId: number;
    hostTournamentId: string;
    activityId: number | null;
    hostGameId: string | null;
  }[]
> {
  const now = new Date();
  const fiveMinAgo = new Date(now.getTime() - 5 * 60_000); // 5 minutes ago
  const thirtyMinAgo = new Date(now.getTime() - 5 * 60 * 60_000); //  2 hours ago

  const endedTournies = await db
    .select({
      id: tournaments.id,
      gameId: tournaments.gameId,
      hostTournamentId: tournaments.hostTournamentId,
      activityId: tournaments.activityId,
      hostGameId: games.hostGameId,
    })
    .from(tournaments)
    .innerJoin(games, eq(tournaments.gameId, games.id))
    // get  tournaments that ended 5 to 120 minutes ago
    .where(and(lt(tournaments.endDate, thirtyMinAgo), gt(tournaments.endDate, fiveMinAgo), isNull(tournaments.rewardLink)));

  return endedTournies;
}

/**
 * 2) Check if we already have ANY leaderboard records
 * for a given tournament (by ID in our local DB)
 */
async function hasLeaderboardRecords(tournamentId: number): Promise<boolean> {
  const [row] = await db
    .select({
      cnt: sql<number>`count
          (*)`,
    })
    .from(gameLeaderboard)
    .where(eq(gameLeaderboard.tournamentId, tournamentId));
  return (row?.cnt ?? 0) > 0;
}

/**
 * 3) Use Elympics leaderboard pages to gather all participants
 */
async function fetchAllElympicsParticipants(hostTournamentId: string, hostGameId: string | null): Promise<GamerData[]> {
  const pageSize = 100;
  let pageNumber = 1;
  let allRows: GamerData[] = [];

  while (true) {
    // Call your getTournamentLeaderboard
    await sleep(200); // sleep  200ms between requests
    const lbData = await getTournamentLeaderboard(hostGameId, hostTournamentId, pageSize, pageNumber);
    if (!lbData.data.length) break;
    logger.info(`Elympics leaderboard page ${pageNumber} =>`, lbData.data);

    // Convert Elympics response to the shape we need
    const mapped = lbData.data.map((entry) => ({
      telegramId: parseInt(entry.telegramId, 10) || 0,
      userId: entry.userId,
      nickname: entry.nickname || undefined,
      position: entry.position,
      points: entry.points,
      matchId: entry.matchId,
      endedAt: entry.endedAt,
    }));

    allRows = allRows.concat(mapped);

    // If we've reached the end, or no more pages
    if (pageNumber >= lbData.totalPages) break;

    pageNumber++;
  }

  return allRows;
}

/**
 * Insert participant records into the local `game_leaderboard`
 * but first, ensure each participant's `telegramId` user exists in `users`.
 * If not, insert them with role='user'.
 */
export async function insertParticipantsToLeaderboard(
  tourney: { id: number; gameId: number; hostTournamentId: string },
  participants: GamerData[]
) {
  if (!participants.length) return;

  // 1) Gather distinct telegramIds from participants
  const distinctTelegramIds = Array.from(
    new Set(participants.map((p) => p.telegramId).filter((id) => id > 0)) // exclude 0 or invalid IDs
  );

  if (distinctTelegramIds.length) {
    // 2) Fetch existing user_ids from the 'users' table
    const existingUsers = await db
      .select({ user_id: users.user_id })
      .from(users)
      .where(inArray(users.user_id, distinctTelegramIds));

    const existingIds = new Set(existingUsers.map((row) => row.user_id));

    // 3) Build a list of those that do NOT exist
    const missingIds = distinctTelegramIds.filter((id) => !existingIds.has(id));
    logger.info(`Missing IDs for tournament #${tourney.id} =>`, missingIds);
    // 4) Bulk-insert them into 'users' with role = 'user'
    if (missingIds.length) {
      // Insert each missing ID
      await db.insert(users).values(
        missingIds.map((telegramId) => ({
          user_id: telegramId, // the primary key
          role: "user", // default role
          first_name: null,
          last_name: null,
          username: null,
          // any other fields can be left as defaults or null
        }))
      );
    }
  }

  // 5) Now proceed to insert participants into game_leaderboard
  const rowsToInsert = participants.map((p) => ({
    hostUserId: p.userId,
    telegramUserId: p.telegramId,
    tournamentId: tourney.id,
    gameId: tourney.gameId,
    hostTournamentId: tourney.hostTournamentId,
    nickname: p.nickname,
    position: p.position,
    points: p.points,
    matchId: p.matchId,
    endedAt: new Date(p.endedAt),
  }));

  await db.insert(gameLeaderboard).values(rowsToInsert);
}

/**
 * 5) Generate a single-column CSV of participant telegram IDs
 */
function generateTelegramCsv(participants: { telegramId: number }[]): Buffer {
  // Each line is the telegram ID as an integer
  const lines = participants.map((p) => String(p.telegramId));
  return Buffer.from(lines.join("\n"), "utf8");
}

/**
 * 6) POST CSV to Ton Society with retry:
 * /activities/{activity_id}/allowlist/telegram-ids
 * returns reward_link if successful
 *
 * If there's a 429 or 500 error, we'll retry up to 10 times,
 * sleeping 30 seconds between attempts.
 */
async function postTelegramCsvToTonSociety(activityId: number, csvBuffer: Buffer): Promise<string | null> {
  if (!activityId) return null;

  const formData = new FormData();
  formData.append("file", csvBuffer, {
    filename: "participants.csv",
    contentType: "text/csv",
  });

  const baseUrl = process.env.TON_SOCIETY_BASE_URL || "";
  const apiKey = process.env.TON_SOCIETY_API_KEY || "";
  const url = `${baseUrl}/activities/${activityId}/allowlist/telegram-ids`;

  let attempts = 0;
  while (attempts < 10) {
    try {
      const res = await axios.post(url, formData, {
        headers: {
          ...formData.getHeaders(),
          "x-api-key": apiKey,
          "x-partner-id": "onton", // or your partner ID
        },
      });

      // We expect { status: "success", data: { reward_link_url: "..."} }
      if (res.data?.status === "success" && res.data?.data?.reward_link_url) {
        return res.data.data.reward_link_url;
      } else {
        logger.error(`Unrecognized response from Ton Society allowlist  for activityId=${activityId} =>`, res.data);
        return null;
      }
    } catch (error) {
      const status = (error as AxiosError)?.response?.status;
      // If 429 or 500 => retry with 30s sleep
      if (status === 429 || status === 500) {
        attempts++;
        if (attempts >= 10) {
          logger.error(`Max retries reached for activityId=${activityId}. Last error =>`, error);
          return null;
        }
        logger.warn(`Retry #${attempts} after HTTP ${status} error for activityId=${activityId} sleeping 20s...`);
        await new Promise((resolve) => setTimeout(resolve, 20_000));
      } else {
        // Other status => no retry
        logger.error("Error posting CSV to Ton Society =>", error);
        return null;
      }
    }
  }

  return null; // if somehow we exit loop
}

/**
 * 7) The main function to be called by cron every X minutes
 */
export async function processRecentlyEndedTournaments() {
  // a) find tournaments ended 5-30 min ago
  const ended = await getJustEndedTournaments();
  if (!ended.length) {
    logger.info("No recently ended tournaments found.");
    return;
  }

  for (const t of ended) {
    if (!t.activityId) {
      logger.warn(`Tournament ID=${t.id} has no Ton Society activityId. Skipping...`);
      continue;
    }

    // b) check if we have local participants
    const hasRecords = await hasLeaderboardRecords(t.id);
    if (!hasRecords) {
      // gather all participants from Elympics
      const participants = await fetchAllElympicsParticipants(t.hostTournamentId, t.hostGameId || null);
      logger.info(`Participants for tournament #${t.id} =>`, participants);
      if (participants.length) {
        await insertParticipantsToLeaderboard(t, participants);
      } else {
        logger.info(`No Elympics participants found for tournament #${t.id} / hostTID=${t.hostTournamentId}`);
      }
    }

    // c) now get the final set of participants (post-insert) to generate CSV
    const finalRows = await db
      .select({ telegramId: gameLeaderboard.telegramUserId })
      .from(gameLeaderboard)
      .where(eq(gameLeaderboard.tournamentId, t.id));

    if (!finalRows.length) {
      logger.info(`No participants for tournament #${t.id} after insertion; skipping allowlist upload.`);
      continue;
    }

    logger.info(`Participants for tournament #${t.id} =>`, finalRows);

    // d) generate CSV
    const csvBuff = generateTelegramCsv(finalRows);

    // e) post to Ton Society => get reward_link
    const rewardLink = await postTelegramCsvToTonSociety(t.activityId, csvBuff);
    if (rewardLink) {
      await db.update(gameLeaderboard).set({ rewardCreated: true }).where(eq(gameLeaderboard.tournamentId, t.id));
      // save reward_link in tournaments table
      await db.update(tournaments).set({ rewardLink }).where(eq(tournaments.id, t.id));
      logger.info(`Tournament #${t.id} => reward_link saved: ${rewardLink}`);
    }
  }
}
