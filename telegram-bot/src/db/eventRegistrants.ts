import { pool } from "./pool";
import { logger } from "../utils/logger";

export interface RegistrantRow {
  user_id: number;
  // ... more columns from event_registrants
}

export async function getEventTickets(uuid: string) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `
          SELECT *
          FROM event_registrants
          WHERE event_uuid = $1
            AND (status = 'approved' OR status = 'checkedin')
      `,
      [uuid],
    );
    return result.rows;
  } finally {
    client.release();
  }
}

export async function getApprovedRegistrants(eventUUID: string) {
  const client = await pool.connect();
  try {
    const query = `
        SELECT user_id
        FROM event_registrants
        WHERE event_uuid = $1
          AND status = 'approved'
    `;
    const result = await client.query(query, [eventUUID]);
    return result.rows; // each row is { user_id: number }
  } catch (error) {
    logger.error("Error in getApprovedRegistrants:", error);
    throw error;
  } finally {
    client.release();
  }
}
