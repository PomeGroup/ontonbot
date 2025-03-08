import { TVisitor } from "../utils/types";
import { Pool } from "pg";
import { logger } from "../utils/logger";
import { redisTools } from "../lib/redisTools";
import { generateRandomHash } from "../helpers/generateRandomHash";


// cache keys
export const getUserCacheKey = (userId: number) => `${redisTools.cacheKeys.user}${userId}`;
export const getEventById = async (id: number) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT *
       FROM events
       WHERE event_id = $1`,
      [id],
    );
    return result.rows[0];
  } finally {
    client.release();
  }
};
// Create a single pool instance for your entire application
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 50, // maximum number of clients in the pool
  idleTimeoutMillis: 30000, // close idle clients after 30s
  connectionTimeoutMillis: 2000, // return an error after 2s if connection could not be established
});

const createDatabase = async () => {
  const client = await pool.connect();

  try {
    await client.query(`
        CREATE TABLE IF NOT EXISTS telegram_bot_visitors
        (
            id
                SERIAL
                PRIMARY
                    KEY,
            telegram_id
                TEXT
                NOT
                    NULL,
            first_name
                TEXT,
            last_name
                TEXT,
            username
                TEXT,
            created_at
                TIMESTAMP
                DEFAULT
                    CURRENT_TIMESTAMP
        );
    `);
  } finally {
    client.release();
  }
};

export const getEvent = async (uuid: string) => {
  const client = await pool.connect();

  let event:
    | undefined
    | {
    title: string;
    description: string;
    subtitle: string;
    image_url: string;
    start_date: string;
    end_date: string;
    timezone: string;
  };

  try {
    event = (
      await client.query(
        `
            SELECT *
            FROM events
            WHERE event_uuid = $1;
        `,
        [uuid],
      )
    ).rows[0];
  } finally {
    client.release();
  }

  return event;
};


/**
 * A separate function for creating affiliate links in the database.
 * Returns an array of newly created links and the final groupTitle.
 */
export const createAffiliateLinks = async (params: {
  eventId: number;
  userId: number;
  itemType: string;  // "EVENT" or "HOME"
  baseTitle: string;
  count: number;
}) => {
  const { eventId, userId, itemType, baseTitle, count } = params;

  // We'll return these
  const links: {
    id: number;
    link_hash: string;
    title: string;
    group_title: string;
    item_type: string;
    item_id?: number;
  }[] = [];

  let groupTitle: string | null = null;
  let firstLinkId: number | null = null;

  // Acquire a client for the entire insertion
  const client = await pool.connect();
  try {
    for (let i = 0; i < count; i++) {
      const singleLinkTitle = `${baseTitle}-${i + 1}`;
      const linkHash = generateRandomHash(8);

      // Insert statement
      const insertQuery = `
          INSERT INTO affiliate_links ("Item_id",
                                       "item_type",
                                       "creator_user_id",
                                       "link_hash",
                                       "total_clicks",
                                       "total_purchase",
                                       "active",
                                       "affiliator_user_id",
                                       "created_at",
                                       "updated_at",
                                       "title",
                                       "group_title")
          VALUES ($1, $2, $3, $4,
                  0, 0, true,
                  $5, CURRENT_DATE, NULL,
                  $6, $7)
          RETURNING id, link_hash, title, group_title
      `;

      // If this is the first link, we temporarily insert with empty group_title
      if (i === 0) {
        const result = await client.query(insertQuery, [
          eventId,
          itemType,
          userId,
          linkHash,
          userId,
          singleLinkTitle,
          "", // empty group_title for now
        ]);

        const newLink = result.rows[0];
        firstLinkId = newLink.id;
        groupTitle = `${baseTitle}`; // e.g. "HelloWorld"

        // Now update the first link with the final group_title
        await client.query(
          `UPDATE affiliate_links
           SET "group_title" = $1
           WHERE "id" = $2`,
          [groupTitle, firstLinkId],
        );

        // Push to array with the new groupTitle
        links.push({
          id: newLink.id,
          link_hash: newLink.link_hash,
          title: singleLinkTitle,
          group_title: groupTitle,
          item_type: itemType,
          item_id: eventId,
        });
      } else {
        // For subsequent links, we know groupTitle
        const result = await client.query(insertQuery, [
          eventId,
          itemType,
          userId,
          linkHash,
          userId,
          singleLinkTitle,
          groupTitle, // re-use existing groupTitle
        ]);
        const newLink = result.rows[0];
        links.push({
          id: newLink.id,
          link_hash: newLink.link_hash,
          title: newLink.title,
          group_title: newLink.group_title,
          item_type: itemType,
          item_id: eventId,
        });
      }
    }
  } finally {
    client.release();
  }

  return { links, groupTitle: groupTitle || "" };
};


export const addVisitor = async (visitor: TVisitor) => {
  const client = await pool.connect();

  try {
    const visitorExists = await client.query(
      "SELECT * FROM telegram_bot_visitors WHERE telegram_id = $1",
      [visitor.telegram_id],
    );

    if (visitorExists.rowCount === 0) {
      await client.query(
        "INSERT INTO telegram_bot_visitors (telegram_id, first_name, last_name, username) VALUES ($1, $2, $3, $4)",
        [
          visitor.telegram_id,
          visitor.first_name,
          visitor.last_name,
          visitor.username,
        ],
      );
    }
  } finally {
    client.release();
  }
};

export const changeRole = async (newRole: string, username: string) => {
  const client = await pool.connect();

  try {
    // Check if the user exists
    const userExists = await client.query(
      "SELECT * FROM users WHERE username = $1 or user_id::text = $1",
      [username],
    );

    if (userExists.rowCount === 0) {
      throw new Error("user_not_found");
    }

    if (userExists.rows[0].role === newRole) {
      throw new Error("nothing_to_update");
    }

    try {
      const UpdateResult = await client.query(
        `
            UPDATE users
            SET role = $1
            WHERE username = $2
               OR user_id::text = $2
            RETURNING user_id
        `,
        [newRole, username],
      );

// result.rows[0] now contains the updated row, including user_id
      const updatedUserId = UpdateResult.rows[0]?.user_id;
      await redisTools.deleteCache(getUserCacheKey(updatedUserId));

    } catch (error) {
      logger.error("Error in changeRole:", error);
      client.release();
      throw error;
    }

    const totalOrgsQuery = "SELECT count(*) FROM users WHERE role = $1";
    const result = await client.query(totalOrgsQuery, ["organizer"]); // Use parameterized queries to avoid SQL injection
    const totalOrgs = result.rows[0].count;

    client.release();
    logger.log(`Role for ${username} changed to ${newRole}.`);

    return {
      username: userExists.rows[0].username,
      user_id: userExists.rows[0].user_id,
      total_organizers_count: totalOrgs,
    };
  } catch (error) {
    logger.error("Error in changeRole:", error);
    client.release();
    throw error;
  }
};

export const getUser = async (usernameOrId: string) => {
  const client = await pool.connect();

  const user = await client.query(
    `SELECT *
     FROM users
     WHERE username = $1
        or user_id::text = $1`,
    [usernameOrId],
  );
  client.release();
  return user.rows[0];
};

export const isUserAdmin = async (usernameOrId: string) => {
  const user = await getUser(usernameOrId);
  if (!user) {
    return { isAdmin: false, user: null };
  }
  return { isAdmin: user.role === "admin", user };
};
export const isUserOrganizerOrAdmin = async (usernameOrId: string) => {
  const user = await getUser(usernameOrId);
  if (!user) {
    return { isOrganizerOrAdmin: false, user: null };
  }
  return { isOrganizerOrAdmin: user.role === "organizer" || user.role === "admin", user };
};


export const getEventTickets = async (uuid: string) => {
  const client = await pool.connect();

  let event: {
    user_id: number;
  }[];

  try {
    event = (
      await client.query(
        `
            SELECT *
            FROM event_registrants
            WHERE event_uuid = $1
              and (status = 'approved' or status = 'checkedin');

        `,
        [uuid],
      )
    ).rows;
  } finally {
    client.release();
  }

  return event;
};

export const fetchOntonSetting = async () => {
  try {
    const client = await pool.connect();

    const settings = await client.query(
      `SELECT *
       FROM onton_setting
       where env = $1`,
      [process.env.ENV],
    );

    client.release();

    let config: { [key: string]: string | null } = {};
    let configProtected: { [key: string]: string | null } = {};

    settings.rows.forEach((setting) => {
      const key = `${setting.var}`;
      if (setting.protected === true) {
        configProtected[key] = setting.value;
      } else {
        config[key] = setting.value;
      }
    });

    return { config, configProtected };
  } catch (error) {
    logger.error(error);
  }
};

export const getAdminOrganizerUsers = async () => {
  const client = await pool.connect();

  try {
    const result = await client.query(
      `SELECT *
       FROM users
       WHERE role IN ('admin', 'organizer') `,
    );
    return result.rows; // array of user rows
  } finally {
    client.release();
  }
};

export const updateUserProfile = async (
  userId: number,
  {
    isPremium,
    allowsWriteToPm,
    photoUrl,
    hasBlockedBot,
  }: {
    isPremium?: boolean;
    allowsWriteToPm?: boolean;
    photoUrl?: string;
    hasBlockedBot?: boolean;
  },
) => {
  const client = await pool.connect();

  try {
    // Build a dynamic UPDATE query for fields that are defined
    const setClauses: string[] = [];
    const values: any[] = [];

    if (typeof isPremium !== "undefined") {
      values.push(isPremium);
      setClauses.push(`is_premium = $${values.length}`);
    }
    if (typeof allowsWriteToPm !== "undefined") {
      values.push(allowsWriteToPm);
      setClauses.push(`allows_write_to_pm = $${values.length}`);
    }
    if (typeof photoUrl !== "undefined") {
      values.push(photoUrl);
      setClauses.push(`photo_url = $${values.length}`);
    }
    if (typeof hasBlockedBot !== "undefined") {
      values.push(hasBlockedBot);
      setClauses.push(`has_blocked_the_bot = $${values.length}`);
    }

    // If there are no field changes, just return early
    if (!setClauses.length) return;

    // Also update updated_at to the current timestamp
    // (Note: We do this unconditionally, because at least one field is changing)
    setClauses.push(`updated_at = NOW()`);

    // Finally push userId
    values.push(userId);
    await redisTools.deleteCache(getUserCacheKey(userId));

    const query = `
        UPDATE users
        SET ${setClauses.join(", ")}
        WHERE user_id = $${values.length};
    `;

    await client.query(query, values);
  } finally {
    client.release();
  }
};

// We'll define an interface for each result row
interface SbtDistResult {
  userId: number;
  user_name: string;       // from "users" table, or empty if not found
  process_result: "added" | "reward exist" | "not onton user" | "invalid userId";
}

/**
 * For each userId line, we do:
 * 1) Validate user ID
 * 2) Check if user is in "users" table -> if not, process_result = "not onton user"
 * 3) Upsert "visitors"
 * 4) Insert "rewards" if none exist, or skip
 * 5) Return array of { user_id, user_name, process_result }
 */
export const processCsvLinesForSbtDist = async (
  eventUUID: string,
  userIdLines: string[],
): Promise<SbtDistResult[]> => {
  const results: SbtDistResult[] = [];

  const client = await pool.connect();
  try {
    for (const rawLine of userIdLines) {
      const line = rawLine.trim();
      if (!line) continue;

      // 1) Parse userId
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

      // 2) Check if user is in "users" table
      const { rows: userRows } = await client.query(
        "SELECT username FROM users WHERE user_id = $1",
        [userId],
      );
      if (userRows.length === 0) {
        // Not an Onton user
        results.push({
          userId,
          user_name: "",
          process_result: "not onton user",
        });
        continue;
      }

      const userName = userRows[0].username || "";

      // 3) Upsert "visitors"
      let processResult: SbtDistResult["process_result"] = "added"; // default if we add a reward
      try {
        // Insert if not exists
        const upsertVisitorQuery = `
            WITH inserted AS (
                INSERT INTO visitors (user_id, event_uuid)
                    SELECT $1, $2
                    WHERE NOT EXISTS (SELECT 1
                                      FROM visitors
                                      WHERE user_id = $1
                                        AND event_uuid = $2)
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

        // 4) Check if there's already a reward
        const { rows: rewardRows } = await client.query(
          "SELECT id, status FROM rewards WHERE visitor_id = $1 and type = 'ton_society_sbt'",
          [visitorId],
        );
        if (rewardRows.length > 0) {
          // Reward exists => skip
          processResult = "reward exist";
        } else {
          // Insert reward with status=pending_creation
          const insertRewardQuery = `
              INSERT INTO rewards (visitor_id,
                                   type,
                                   data,
                                   event_end_date,
                                   event_start_date,
                                   status,
                                   updated_by)
              VALUES ($1, $2, $3, $4, $5, $6, $7)
              RETURNING id
          `;
          const insertRes = await client.query(insertRewardQuery, [
            visitorId,
            "ton_society_sbt", // type
            null,              // data
            0,                 // event_end_date
            123,               // event_start_date
            "pending_creation",// status
            "sbtdist_command", // updated_by
          ]);
          const rewardId = insertRes.rows[0]?.id;
          logger.log(`User: ${userId}, reward_id=${rewardId} inserted (pending_creation).`);
          processResult = "added";
        }
      } catch (err) {
        logger.error(`Error processing userId=${userId}`, err);
      }

      // 5) Add to results
      results.push({
        userId: userId,
        user_name: userName,
        process_result: processResult,
      });
    } // end for

    return results;
  } finally {
    client.release();
  }
};

// This function returns an array of rows, each with user_id
export const getApprovedRegistrants = async (eventUUID: string) => {
  const client = await pool.connect();
  try {
    const query = `
        SELECT user_id
        FROM event_registrants
        WHERE event_uuid = $1
          AND status = 'approved'
    `;
    const result = await client.query(query, [eventUUID]);
    return result.rows; // each row has { user_id: number }
  } catch (error) {
    logger.error("Error in getApprovedRegistrants:", error);
    throw error;
  } finally {
    client.release();
  }
};

export interface EventRow {
  event_id: number;
  event_uuid: string;
  title: string;
  owner: number;
  end_date: number;
  event_telegram_group?: number | null;
}

// 1) For admin: fetch all upcoming "online" + "registration" events
export async function getUpcomingOnlineRegEventsForAdmin(): Promise<EventRow[]> {
  const client = await pool.connect();
  try {
    const sql = `
        SELECT event_id, event_uuid, title, owner, end_date, event_telegram_group
        FROM events
        WHERE participation_type = 'online'
          AND has_registration = TRUE
          AND end_date > EXTRACT(EPOCH FROM now())
        ORDER BY end_date ASC
        LIMIT 100
    `;
    const res = await client.query(sql);
    return res.rows;
  } finally {
    client.release();
  }
}

// 2) For organizer: fetch only the user’s events that are upcoming, online, and have registration
export const getUpcomingOnlineRegEventsForOrganizer = async (userId: number): Promise<EventRow[]> => {
  const client = await pool.connect();
  try {
    const sql = `
        SELECT event_id, event_uuid, title, owner, end_date, event_telegram_group
        FROM events
        WHERE participation_type = 'online'
          AND has_registration = TRUE
          AND end_date > EXTRACT(EPOCH FROM now())
          AND owner = $1
        ORDER BY end_date ASC
        LIMIT 100
    `;
    const res = await client.query(sql, [userId]);
    return res.rows;
  } finally {
    client.release();
  }
};


// 4) Update event_telegram_group in DB
export const updateEventTelegramGroup = async (eventId: number, groupId: number): Promise<void> => {
  const client = await pool.connect();
  try {
    await client.query(
      `UPDATE events
       SET event_telegram_group = $1
       WHERE event_id = $2`,
      [groupId, eventId],
    );
  } finally {
    client.release();
  }
};

createDatabase().then(() => {
  logger.log("Database created successfully");
});
