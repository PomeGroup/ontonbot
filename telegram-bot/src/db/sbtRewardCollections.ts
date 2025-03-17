import { pool } from "./pool";
import { SbtRewardCollection } from "../types/SbtRewardCollection";
import { redisTools } from "../lib/redisTools";

export async function getCollectionsByHubId(hubId: number): Promise<SbtRewardCollection[]> {
  const client = await pool.connect();
  try {
    const result = await client.query<SbtRewardCollection>(
      `SELECT id, "hubID", "hubName", "videoLink", "imageLink"
       FROM sbt_reward_collections
       WHERE "hubID" = $1
       ORDER BY id ASC`,
      [hubId],
    );
    return result.rows;
  } finally {
    client.release();
  }
}

interface CollectionPayload {
  hubID: number;
  imageLink?: string;
  videoLink?: string;
  hubName?: string; // if needed
}

export async function createCollection(payload: CollectionPayload): Promise<number> {
  const client = await pool.connect();
  try {
    const sql = `
        INSERT INTO sbt_reward_collections ("hubID", "imageLink", "videoLink", "hubName")
        VALUES ($1, $2, $3, $4)
        RETURNING id
    `;
    const values = [payload.hubID, payload.imageLink, payload.videoLink, payload.hubName || null];
    const res = await client.query(sql, values);
    await redisTools.deleteCache(redisTools.cacheKeys.SBTRewardCollections);
    await redisTools.deleteCache(`${redisTools.cacheKeys.SBTRewardCollectionByHubID}${payload.hubID}`);
    return res.rows[0].id;
  } finally {
    client.release();
  }
}

export async function updateCollection(collectionId: number, payload: CollectionPayload): Promise<void> {
  const client = await pool.connect();
  try {
    const sql = `
        UPDATE sbt_reward_collections
        SET "hubID"     = $1,
            "imageLink" = $2,
            "videoLink" = $3
        WHERE "id" = $4
    `;
    const values = [payload.hubID, payload.imageLink, payload.videoLink, collectionId];
    await client.query(sql, values);
    await redisTools.deleteCache(redisTools.cacheKeys.SBTRewardCollections);
    await redisTools.deleteCache(`${redisTools.cacheKeys.SBTRewardCollectionByHubID}${payload.hubID}`);
  } finally {
    client.release();
  }
}
