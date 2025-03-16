import { Pool } from "pg";
import { logger } from "../utils/logger";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 50,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Optional: If you still want to run "createDatabase()" or any initialization:
export async function initDatabase() {
  const client = await pool.connect();
  try {
    await client.query(`
        CREATE TABLE IF NOT EXISTS telegram_bot_visitors
        (
            id          SERIAL PRIMARY KEY,
            telegram_id TEXT NOT NULL,
            first_name  TEXT,
            last_name   TEXT,
            username    TEXT,
            created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);

    logger.log("Database initialized successfully");
  } finally {
    client.release();
  }
}
