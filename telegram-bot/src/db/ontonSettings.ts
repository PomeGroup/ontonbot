import { pool } from "./pool";
import { logger } from "../utils/logger";
import { redisTools } from "../lib/redisTools";

const { cacheKeys } = redisTools;

export async function upsertPlay2winFeatured(value: string, env?: string): Promise<void> {
  const client = await pool.connect();
  const environment = env ?? process.env.ENV ?? "development";
  try {
    await client.query(
      `
          INSERT INTO onton_setting (env, var, value, "protected")
          VALUES ($1, 'play-2-win-featured', $2, false)
          ON CONFLICT (env, var)
              DO UPDATE SET value       = EXCLUDED.value,
                            "protected" = EXCLUDED."protected"
      `,
      [environment, value],
    );
    try {
      await redisTools.deleteCache(cacheKeys.ontonSettings);
    } catch (err) {
      logger.log("Error in upsertPlay2winFeatured:", err);
    }
  } finally {
    client.release();
  }
}

export async function getPlay2winFeatured(env?: string): Promise<string | null> {
  const client = await pool.connect();
  const environment = env ?? process.env.ENV ?? "development";
  try {
    const result = await client.query(
      `
          SELECT value
          FROM onton_setting
          WHERE env = $1
            AND var = 'play-2-win-featured'
          LIMIT 1
      `,
      [environment],
    );
    return result.rows.length > 0 ? result.rows[0].value : null;
  } finally {
    client.release();
  }
}

/** Example: fetch all onton settings for the current ENV */
export async function fetchOntonSetting() {
  const client = await pool.connect();
  try {
    const settings = await client.query(
      `SELECT *
       FROM onton_setting
       WHERE env = $1`,
      [process.env.ENV],
    );
    const config: Record<string, string | null> = {};
    const configProtected: Record<string, string | null> = {};

    settings.rows.forEach((setting) => {
      const key = setting.var;
      if (setting.protected === true) {
        configProtected[key] = setting.value;
      } else {
        config[key] = setting.value;
      }
    });
    return { config, configProtected };
  } catch (error) {
    logger.error(error);
  } finally {
    client.release();
  }
}

/**
 * Set a banner in onton_setting, updating homeSliderEventUUID or homeListEventUUID.
 */
export async function setBanner(
  env: string,
  position: string,
  event_uuid: string,
): Promise<void> {
  const client = await pool.connect();
  try {
    const pos = position.toLowerCase();

    // Map position => array index
    const indexMap: Record<string, number> = {
      u1: 0,
      u2: 1,
      d1: 0,
      d2: 1,
      d3: 2,
    };

    // Determine which var to update
    const varName = pos.startsWith("u")
      ? "homeSliderEventUUID"
      : "homeListEventUUID";

    // Fetch current setting row
    const { rows } = await client.query(
      `SELECT value
       FROM onton_setting
       WHERE env = $1
         AND var = $2
       LIMIT 1`,
      [env, varName],
    );

    if (!rows.length) {
      throw new Error(`No existing setting found for env=${env}, var=${varName}`);
    }

    // Current value is a JSON array in the DB
    const currentValue = JSON.parse(rows[0].value);

    // Update the relevant array element
    currentValue[indexMap[pos]] = event_uuid;

    // Convert back to string
    const updatedValue = JSON.stringify(currentValue);

    // Update the DB row
    await client.query(
      `UPDATE onton_setting
       SET value = $1
       WHERE env = $2
         AND var = $3`,
      [updatedValue, env, varName],
    );


    await redisTools.deleteCache(redisTools.cacheKeys.ontonSettings);

  } finally {
    client.release();
  }
}
