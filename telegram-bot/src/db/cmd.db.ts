import { pool } from "./db";
import { redisTools } from "../lib/redisTools";

export async function hideCmd(event_uuid: string, hide: boolean) {
  const client = await pool.connect();
  await client.query(
    "UPDATE events SET hidden = $1 WHERE event_uuid = $2 ",
    [hide, event_uuid],
  );
  const result = await client.query(
    "SELECT * FROM events WHERE event_uuid = $1",
    [event_uuid],
  );
  await redisTools.deleteCache(`${redisTools.cacheKeys.event_uuid}${event_uuid}`);
  await redisTools.deleteCache(`${redisTools.cacheKeys.event_id}${result.rows[0].id}`);
}

export async function setBanner(
  env: string,
  position: string,
  event_uuid: string,
) {
  const client = await pool.connect();
  try {
    const pos = position.toLowerCase();
    const indexMap: Record<string, number> = {
      u1: 0,
      u2: 1,
      d1: 0,
      d2: 1,
      d3: 2,
    };
    const varName = pos.startsWith("u")
      ? "homeSliderEventUUID"
      : "homeListEventUUID";

    const { rows } = await client.query(
      "SELECT value FROM onton_setting WHERE env = $1 AND var = $2 LIMIT 1",
      [env, varName],
    );
    if (!rows.length) throw new Error("No existing setting found.");

    const currentValue = JSON.parse(rows[0].value); // parse string as array
    currentValue[indexMap[pos]] = event_uuid; // update array element
    const updatedValue = JSON.stringify(currentValue);

    await client.query(
      "UPDATE onton_setting SET value = $1 WHERE env = $2 AND var = $3",
      [updatedValue, env, varName],
    );
  } finally {
    client.release();
  }
}
