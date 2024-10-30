// import { open, Database } from 'sqlite';
// import { Database as SQLite3Database } from 'sqlite3';
// import { TVisitor } from '../utils/types';

// async function createDatabase() {
//     const db: Database = await open({
//         filename: '../telegram_users.db',
//         driver: SQLite3Database
//     });

//     await db.exec(`
//         CREATE TABLE IF NOT EXISTS telegram_bot_visitors (
//             id INTEGER PRIMARY KEY,
//             telegram_id TEXT NOT NULL,
//             first_name TEXT,
//             last_name TEXT,
//             username TEXT,
//             created_at DATETIME DEFAULT CURRENT_TIMESTAMP
//         );
//     `);

//     await db.close();
// }

// export async function countReferrals(userId: number): Promise<{ totalReferrals: number, todayReferrals: number }> {
//     const db: Database = await open({
//         filename: 'telegram_users.db',
//         driver: SQLite3Database
//     });

//     try {
//         // Query to count total referrals by the user
//         const totalReferralsQuery = 'SELECT COUNT(*) AS total FROM referrals WHERE referee = ?';
//         const totalRefResult = await db.get(totalReferralsQuery, [userId]);
//         const totalReferrals = totalRefResult ? totalRefResult.total : 0;

//         // Query to count today's referrals by the user
//         const todayReferralsQuery = `
//             SELECT COUNT(*) AS today
//             FROM referrals
//             WHERE referee = ? AND DATE(created_at) = DATE('now')`;
//         const todayRefResult = await db.get(todayReferralsQuery, [userId]);
//         const todayReferrals = todayRefResult ? todayRefResult.today : 0;

//         return { totalReferrals, todayReferrals };
//     } catch (error) {
//         console.error("Error in countReferrals:", error);
//         throw error;
//     } finally {
//         await db.close();
//     }
// }

// export async function addVisitor(visitor: TVisitor) {
//     const db: Database = await open({
//         filename: 'telegram_users.db',
//         driver: SQLite3Database
//     });

//     const visitorExists = await db.get('SELECT * FROM telegram_bot_visitors WHERE telegram_id = ?', [visitor.telegram_id]);

//     if (!visitorExists) {
//         await db.run('INSERT INTO telegram_bot_visitors (telegram_id, first_name, last_name, username) VALUES (?, ?, ?, ?)', [
//             visitor.telegram_id,
//             visitor.first_name,
//             visitor.last_name,
//             visitor.username
//         ]);
//     }

//     await db.close();
// }

// export async function addReferral(referee: number, referral: number) {
//     const db: Database = await open({
//         filename: 'telegram_users.db',
//         driver: SQLite3Database
//     });

//     await db.run('INSERT INTO referrals (referee, referral) VALUES (?, ?)', [
//         referee,
//         referral
//     ]);

//     await db.close();
// }

// createDatabase()

import { Client } from "pg"
import { TVisitor } from "../utils/types"

async function createDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  })


  await client.connect()

  try {
    await client.query(`
            CREATE TABLE IF NOT EXISTS telegram_bot_visitors (
                id SERIAL PRIMARY KEY,
                telegram_id TEXT NOT NULL,
                first_name TEXT,
                last_name TEXT,
                username TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `)
  } finally {
    await client.end()
  }
}

export async function getEvent(uuid: string) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  })

  await client.connect()

  let event: undefined | {
    title: string
    description: string
    subtitle: string
    image_url: string
    start_date: string
    end_date: string
  }

  try {
    event = (await client.query(`
        SELECT * FROM events WHERE event_uuid = $1;
      `, [uuid])).rows[0]
  } finally {
    client.end()
  }

  return event
}

export async function countReferrals(
  userId: number
): Promise<{ totalReferrals: number; todayReferrals: number }> {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  })

  await client.connect()

  try {
    // Total referrals
    const totalReferralsQuery =
      "SELECT COUNT(*) AS total FROM referrals WHERE referee = $1"
    const totalRefResult = await client.query(totalReferralsQuery, [userId])
    const totalReferrals = totalRefResult.rows[0].total

    // Today's referrals
    const todayReferralsQuery = `
            SELECT COUNT(*) AS today 
            FROM referrals 
            WHERE referee = $1 AND DATE(created_at) = CURRENT_DATE`
    const todayRefResult = await client.query(todayReferralsQuery, [userId])
    const todayReferrals = todayRefResult.rows[0].today

    return { totalReferrals, todayReferrals }
  } catch (error) {
    console.error("Error in countReferrals:", error)
    throw error
  } finally {
    await client.end()
  }
}

export async function addVisitor(visitor: TVisitor) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  })
  await client.connect()

  try {
    const visitorExists = await client.query(
      "SELECT * FROM telegram_bot_visitors WHERE telegram_id = $1",
      [visitor.telegram_id]
    )

    if (visitorExists.rowCount === 0) {
      await client.query(
        "INSERT INTO telegram_bot_visitors (telegram_id, first_name, last_name, username) VALUES ($1, $2, $3, $4)",
        [
          visitor.telegram_id,
          visitor.first_name,
          visitor.last_name,
          visitor.username,
        ]
      )
    }
  } finally {
    await client.end()
  }
}

export async function changeRole(newRole: string, username: string) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  })
  await client.connect()

  try {
    // Check if the user exists
    const userExists = await client.query(
      "SELECT * FROM users WHERE username = $1 or user_id::text = $1", [
      username,
    ])

    if (userExists.rowCount === 0) {
      throw new Error("user_not_found")
    }

    if (userExists.rows[0].role === newRole) {
      throw new Error("nothing_to_update")
    }

    await client.query("UPDATE users SET role = $1 WHERE username = $2 or user_id::text = $2", [
      newRole,
      username,
    ])

    await client.end()
  } catch (error) {
    console.error("Error in changeRole:", error)
    await client.end()
    throw error
  }
}


export async function getUser(usernameOrId: string) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  })
  await client.connect()

  const user = await client.query(
    `SELECT * FROM users WHERE username = $1 or user_id::text = $1`, [
    usernameOrId
  ])
  await client.end()
  return user.rows[0]
}

export async function isUserAdmin(usernameOrId: string) {
  const user = await getUser(usernameOrId)

  return { isAdmin: user.role === "admin", user }
}

export async function getEventTickets(uuid: string) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  })

  await client.connect()

  let event: {
    user_id: number
  }[]

  try {
    event = (await client.query(`
        SELECT * FROM tickets WHERE event_uuid = $1;
      `, [uuid])).rows
  } finally {
    client.end()
  }

  return event
}

createDatabase() // Call to initialize the database
