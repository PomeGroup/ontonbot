import { pool } from "./pool";
import { logger } from "../utils/logger";

export interface SbtDistResult {
  userId: number;
  user_name: string;
  process_result: "added" | "reward exist" | "not onton user" | "invalid userId";
}

/**
 * For each userId line, do:
 *  1) Validate user ID
 *  2) Check if user is in "users" table
 *  3) Upsert "visitors"
 *  4) Insert "rewards" if none exist, else skip
 *  5) Return array of { user_id, user_name, process_result }
 */
export async function processCsvLinesForSbtDist(
  eventUUID: string,
  userIdLines: string[],
): Promise<SbtDistResult[]> {
  const results: SbtDistResult[] = [];
  const client = await pool.connect();
  try {
    for (const rawLine of userIdLines) {
      const line = rawLine.trim();
      if (!line) continue;

      // parse userId
      const userId = parseInt(line, 10);
      if (isNaN(userId)) {
        logger.error(`Skipping invalid user ID: ${line}`);
        results.push({
          userId: 0,
          user_name: "",
          process_result: "invalid userId",
        });
        continue;
      }

      // check if user is in "users"
      const { rows: userRows } = await client.query(
        "SELECT username FROM users WHERE user_id = $1",
        [userId],
      );
      if (userRows.length === 0) {
        results.push({
          userId,
          user_name: "",
          process_result: "not onton user",
        });
        continue;
      }
      const userName = userRows[0]?.username || "";

      // upsert visitors
      let processResult: SbtDistResult["process_result"] = "added";
      try {
        const upsertVisitorQuery = `
            WITH inserted AS (
                INSERT INTO visitors (user_id, event_uuid)
                    SELECT $1, $2
                    WHERE NOT EXISTS (SELECT 1 FROM visitors WHERE user_id = $1 AND event_uuid = $2)
                    RETURNING id)
            SELECT id
            FROM inserted
            UNION
            SELECT id
            FROM visitors
            WHERE user_id = $1
              AND event_uuid = $2
        `;
        const visitorRes = await client.query(upsertVisitorQuery, [userId, eventUUID]);
        const visitorId = visitorRes.rows[0]?.id;
        if (!visitorId) {
          logger.error(`Could not get visitor_id for user_id=${userId}. Skipping.`);
          results.push({
            userId,
            user_name: userName,
            process_result: "not onton user",
          });
          continue;
        }

        // check existing reward
        const { rows: rewardRows } = await client.query(
          "SELECT id, status FROM rewards WHERE visitor_id = $1 AND type = 'ton_society_sbt'",
          [visitorId],
        );
        if (rewardRows.length > 0) {
          processResult = "reward exist";
        } else {
          // insert reward
          const insertRewardQuery = `
              INSERT INTO rewards (visitor_id, type, data, event_end_date, event_start_date, status, updated_by)
              VALUES ($1, $2, $3, $4, $5, $6, $7)
              RETURNING id
          `;
          const insertRes = await client.query(insertRewardQuery, [
            visitorId,
            "ton_society_sbt",
            null,
            0,
            123,
            "pending_creation",
            "sbtdist_command",
          ]);
          const rewardId = insertRes.rows[0]?.id;
          logger.log(`User: ${userId}, reward_id=${rewardId} inserted (pending_creation).`);
          processResult = "added";
        }
      } catch (err) {
        logger.error(`Error processing userId=${userId}`, err);
      }

      results.push({
        userId,
        user_name: userName,
        process_result: processResult,
      });
    }
    return results;
  } finally {
    client.release();
  }
}
