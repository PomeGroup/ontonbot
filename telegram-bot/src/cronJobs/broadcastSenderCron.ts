import { Bot, GrammyError } from "grammy";
import { logger } from "../utils/logger";
import {
    fetchPendingBroadcastSends,
    markBroadcastUserSent,
    markBroadcastUserFailed,
    broadcastHasPendingUsers,
    fetchBroadcastErrors,
    countBroadcastSuccess,
    getBroadcastMeta,
} from "../db/broadcast";
import { Readable } from "stream";
import { InputFile } from "grammy";
import { additionalRecipients, AFFILIATE_PLACEHOLDERS } from "../constants";
import { escapeCsv } from "../utils/utils";
function isChatNotFoundError(err: unknown): boolean {
    if (err instanceof GrammyError) {
        return err.error_code === 400 && /chat (?:not )?found/i.test(err.description);
    }
    return /chat (?:not )?found/i.test(String(err));
}
/* ------------------------------------------------------------------ */
/* broadcastSenderCron                                                */
/* ------------------------------------------------------------------ */
export async function broadcastSenderCron(bot: Bot) {
    const rows = await fetchPendingBroadcastSends(100);
    if (!rows.length) return;

    logger.info(`broadcastSenderCron: processing ${rows.length} rows`);

    for (const row of rows) {
        const {
            bu_id,
            user_id,
            retry_count,
            broadcast_id,
            broadcast_type,
            source_chat_id,
            source_message_id,
        } = row;

        try {
            let sentMessageId: number;

            if (broadcast_type === "event") {
                /* 1️⃣  simple copyMessage */
                const msg = await bot.api.copyMessage(
                    user_id,
                    source_chat_id,
                    source_message_id,
                );
                sentMessageId = msg.message_id;
            } else {
                /* 2️⃣  CSV broadcast: we stored the personalised text+media **inside** source message.
                        Easiest: simply copyMessage as well; the placeholder-replacement
                        was done when the broadcast row was created, so the message
                        the admin sent already has the correct text/caption for
                        each user. */
                const msg = await bot.api.copyMessage(
                    user_id,
                    source_chat_id,
                    source_message_id,
                );
                sentMessageId = msg.message_id;
            }

            await markBroadcastUserSent(bu_id, sentMessageId);
            logger.info(`broadcastSenderCron: sent to ${user_id}`);
        } catch (err) {
            logger.warn(`broadcastSenderCron: error to ${user_id}: ${err}`);

            const is403  = isForbiddenError(err);
            const is404  = isChatNotFoundError(err);   // 🔸 new
            const finalFail = is403 || is404 || retry_count + 1 >= 10;

            await markBroadcastUserFailed(
                bu_id,
                retry_count + 1,
                String(err),
                finalFail,);
        }

        /* obey rate-limit: ~10 msgs/sec */
        await delay(100);
    }

    /* ---------------------------------------------------------------- */
    /* For every broadcast we touched, check if it is now finished       */
    /* ---------------------------------------------------------------- */
    const finishedIds = new Set<number>(rows.map((r) => r.broadcast_id));

    for (const bid of Array.from(finishedIds)) {
        if (await broadcastHasPendingUsers(bid)) continue;   // still work left
        await notifyAdminsAboutFinishedBroadcast(bot, bid);
    }
}

/* ------------------------------------------------------------------ */
/* final report to admins                                             */
/* ------------------------------------------------------------------ */
async function notifyAdminsAboutFinishedBroadcast(bot: Bot, broadcastId: number) {
    const { source_chat_id, source_message_id } = await getBroadcastMeta(
        broadcastId,
    );
    const successCount = await countBroadcastSuccess(broadcastId);
    const errors = await fetchBroadcastErrors(broadcastId);

    const summary = `Broadcast #${broadcastId} finished.\n- Success: ${successCount}\n- Errors: ${errors.length}`;

    /* 1) forward original message */
    for (const adminId of additionalRecipients) {
        try {
            await bot.api.copyMessage(adminId, source_chat_id, source_message_id, {
                caption: "Original broadcasted message.",
            });
        } catch (e) {
            logger.warn(`notifyAdmins: cannot fwd to ${adminId}: ${e}`);
        }

        try {
            await bot.api.sendMessage(adminId, summary);
        } catch (e) {
            logger.warn(`notifyAdmins: cannot send summary to ${adminId}: ${e}`);
        }

        if (!errors.length) continue;

        /* 2) CSV with errors */
        const csvStr =
            ["user_id,error", ...errors.map((e) => `${e.user_id},${escapeCsv(e.last_error)}`)].join(
                "\n",
            );
        const stream = Readable.from(csvStr);
        const csvFile = new InputFile(stream, "broadcast_errors.csv");

        try {
            await bot.api.sendDocument(adminId, csvFile, {
                caption: "Broadcast encountered errors. See CSV.",
            });
        } catch (e) {
            logger.warn(`notifyAdmins: cannot send CSV to ${adminId}: ${e}`);
        }
    }

    logger.info(`broadcastSenderCron: notified admins about #${broadcastId}`);
}

/* ------------------------------------------------------------------ */
/* helpers                                                            */
/* ------------------------------------------------------------------ */
function isForbiddenError(err: unknown) {
    if (err instanceof GrammyError) return err.error_code === 403;
    return String(err).includes("403");
}

function delay(ms: number) {
    return new Promise<void>((res) => setTimeout(res, ms));
}
