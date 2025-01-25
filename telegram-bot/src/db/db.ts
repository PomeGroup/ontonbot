import { TVisitor } from "../utils/types";
import { Pool } from "pg";

// Create a single pool instance for your entire application
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 50, // maximum number of clients in the pool
  idleTimeoutMillis: 30000, // close idle clients after 30s
  connectionTimeoutMillis: 2000, // return an error after 2s if connection could not be established
});

async function createDatabase() {
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
}

export async function getEvent(uuid: string) {
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
}

export async function countReferrals(
  userId: number,
): Promise<{ totalReferrals: number; todayReferrals: number }> {
  const client = await pool.connect();

  try {
    // Total referrals
    const totalReferralsQuery =
      "SELECT COUNT(*) AS total FROM referrals WHERE referee = $1";
    const totalRefResult = await client.query(totalReferralsQuery, [userId]);
    const totalReferrals = totalRefResult.rows[0].total;

    // Today's referrals
    const todayReferralsQuery = `
        SELECT COUNT(*) AS today
        FROM referrals
        WHERE referee = $1 AND DATE (created_at) = CURRENT_DATE`;
    const todayRefResult = await client.query(todayReferralsQuery, [userId]);
    const todayReferrals = todayRefResult.rows[0].today;

    return { totalReferrals, todayReferrals };
  } catch (error) {
    console.error("Error in countReferrals:", error);
    throw error;
  } finally {
    client.release();
  }
}

export async function addVisitor(visitor: TVisitor) {
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
}

export async function changeRole(newRole: string, username: string) {
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

    await client.query(
      "UPDATE users SET role = $1 WHERE username = $2 or user_id::text = $2",
      [newRole, username],
    );


    const totalOrgsQuery = "SELECT count(*) FROM users WHERE role = $1";
    const result = await client.query(totalOrgsQuery, ["organizer"]); // Use parameterized queries to avoid SQL injection
    const totalOrgs = result.rows[0].count;

    client.release();

    return {
      username: userExists.rows[0].username,
      user_id: userExists.rows[0].user_id,
      total_organizers_count: totalOrgs,
    };
  } catch (error) {
    console.error("Error in changeRole:", error);
    client.release();
    throw error;
  }
}

export async function getUser(usernameOrId: string) {
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
}

export async function isUserAdmin(usernameOrId: string) {
  const user = await getUser(usernameOrId);

  return { isAdmin: user.role === "admin", user };
}

export async function getEventTickets(uuid: string) {
  const client = await pool.connect();

  let event: {
    user_id: number;
  }[];

  try {
    event = (
      await client.query(
        `
            SELECT *
            FROM tickets
            WHERE event_uuid = $1;
        `,
        [uuid],
      )
    ).rows;
  } finally {
    client.release();
  }

  return event;
}

export async function fetchOntonSetting() {
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
    console.error(error);
  }
}

export async function getAdminOrganizerUsers() {
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
}

export async function updateUserProfile(
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
) {
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

    // If there’s nothing to update, return early
    if (!setClauses.length) return;

    // Finally push userId
    values.push(userId);
    const query = `
        UPDATE users
        SET ${setClauses.join(", ")}
        WHERE user_id = $${values.length};
    `;

    await client.query(query, values);
  } finally {
    client.release();
  }
}




createDatabase().then(() => {
  console.log("Database created successfully");
});
