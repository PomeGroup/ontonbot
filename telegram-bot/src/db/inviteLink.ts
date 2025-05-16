/* -------------------------------------------------------------------------- */
/* getOrCreateSingleInviteLinkForUserAndChat => DB approach to re-use invites*/
/* -------------------------------------------------------------------------- */
import {MyContext} from "../types/MyContext";
import {pool} from "./db";
import {logger} from "../utils/logger";

export async function getOrCreateSingleInviteLinkForUserAndChat(
    api: MyContext["api"],
    userId: number,
    chatId: number
): Promise<string> {
    // 1) Check if user_invite_links row already exists
    const client = await pool.connect();
    let existingLink: string | null = null;
    try {
        const sqlCheck = `
      SELECT invite_link
      FROM user_invite_links
      WHERE user_id=$1
        AND chat_id=$2
      LIMIT 1
    `;
        const checkRes = await client.query(sqlCheck, [userId, chatId]);
        if (checkRes.rowCount > 0) {
            existingLink = checkRes.rows[0].invite_link;
            logger.info(`Reusing existing invite link for user=${userId} chat=${chatId}: ${existingLink}`);
        }
    } finally {
        client.release();
    }

    if (existingLink) {
        return existingLink;
    }

    // 2) If not found => create new single-use link
    const linkObj = await api.createChatInviteLink(chatId, {
        member_limit: 1,
        name: "One-time link",
    });
    const newLink = linkObj.invite_link;
    logger.info(`Created new invite link for user=${userId} chatId=${chatId}: ${newLink}`);

    // 3) Insert into user_invite_links
    const client2 = await pool.connect();
    try {
        const sqlInsert = `
      INSERT INTO user_invite_links (user_id, chat_id, invite_link)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, chat_id) DO NOTHING
    `;
        await client2.query(sqlInsert, [userId, chatId, newLink]);
    } finally {
        client2.release();
    }

    return newLink;
}
