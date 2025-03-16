import { pool } from "./pool";
import { logger } from "../utils/logger";
import { TVisitor } from "../utils/types";

export async function addTelegramBotVisitor(visitor: TVisitor) {
  const client = await pool.connect();
  try {
    const sql = `
        SELECT id
        FROM telegram_bot_visitors
        WHERE telegram_id = $1
    `;
    const visitorExists = await client.query(sql, [visitor.telegram_id]);

    if (visitorExists.rowCount === 0) {
      await client.query(
        `INSERT INTO telegram_bot_visitors (telegram_id, first_name, last_name, username)
         VALUES ($1, $2, $3, $4)`,
        [visitor.telegram_id, visitor.first_name, visitor.last_name, visitor.username],
      );
    }
  } finally {
    client.release();
  }
}
