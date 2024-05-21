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

import { Client } from "pg";
import { TVisitor } from "../utils/types";

async function createDatabase() {

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });


  await client.connect();

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
        `);
  } finally {
    await client.end();
  }
}

export async function countReferrals(
  userId: number
): Promise<{ totalReferrals: number; todayReferrals: number }> {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();

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
            WHERE referee = $1 AND DATE(created_at) = CURRENT_DATE`;
    const todayRefResult = await client.query(todayReferralsQuery, [userId]);
    const todayReferrals = todayRefResult.rows[0].today;

    return { totalReferrals, todayReferrals };
  } catch (error) {
    console.error("Error in countReferrals:", error);
    throw error;
  } finally {
    await client.end();
  }
}

export async function addVisitor(visitor: TVisitor) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  await client.connect();

  try {
    const visitorExists = await client.query(
      "SELECT * FROM telegram_bot_visitors WHERE telegram_id = $1",
      [visitor.telegram_id]
    );

    if (visitorExists.rowCount === 0) {
      await client.query(
        "INSERT INTO telegram_bot_visitors (telegram_id, first_name, last_name, username) VALUES ($1, $2, $3, $4)",
        [
          visitor.telegram_id,
          visitor.first_name,
          visitor.last_name,
          visitor.username,
        ]
      );
    }
  } finally {
    await client.end();
  }
}

export async function changeRole(username: string, newRole: string) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  await client.connect();

  try {
    await client.query("UPDATE users SET role = $1 WHERE username = $2", [
      newRole,
      username,
    ]);
  } finally {
    await client.end();
  }
}

createDatabase(); // Call to initialize the database
