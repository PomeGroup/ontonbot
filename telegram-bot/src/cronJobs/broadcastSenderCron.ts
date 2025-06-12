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
import {additionalRecipients, AFFILIATE_PLACEHOLDERS, INVITE_PLACEHOLDER_REGEX} from "../constants";
import {escapeCsv, generateBroadcastGroupTitle, normalizeDashes} from "../utils/utils";
import {getOrCreateSingleInviteLinkForUserAndChat} from "../db/db";
import {getOrCreateSingleAffiliateLink} from "../db/affiliateLinks";
function isChatNotFoundError(err: unknown): boolean {
    if (err instanceof GrammyError) {
        return err.error_code === 400 && /chat (?:not )?found/i.test(err.description);
    }
    return /chat (?:not )?found/i.test(String(err));
}

/* ------------------------------------------------------------------ */
/* Placeholder replacement (same logic you had in composer)           */
/* ------------------------------------------------------------------ */
async function replacePlaceholdersAndLinks(
    baseText: string,
    userId: number,
    broadcastGroupTitle: string,
    bot: Bot,
): Promise<string> {
    let newText = normalizeDashes(baseText);

    // affiliate placeholders
    for (const ph of AFFILIATE_PLACEHOLDERS) {
        if (!newText.includes(ph)) continue;
        const itemType = ph.replace(/[{}]/g, "");
        const baseTitle = `broadcast-${itemType}-${userId}`;

        try {
            const linkRow = await getOrCreateSingleAffiliateLink(
                userId,
                itemType,
                baseTitle,
                broadcastGroupTitle,
            );
            const finalLink =
                `https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME}/event?startapp=campaign-aff-${linkRow.link_hash}`;
            newText = newText.replace(ph, finalLink);
        } catch (err) {
            logger.error(`aff link err for ${userId}: ${err}`);
            newText = newText.replace(ph, "[LINK_ERROR]");
        }
    }

    // invite placeholders
    const invites = Array.from(newText.matchAll(INVITE_PLACEHOLDER_REGEX));
    for (const m of invites) {
        const full = m[0];
        const chatId = parseInt(m[1], 10);
        try {
            const link = await getOrCreateSingleInviteLinkForUserAndChat(
                bot.api,
                userId,
                chatId,
            );
            newText = newText.replace(full, link);
        } catch (err) {
            logger.warn(`invite link err uid=${userId} chat=${chatId}: ${err}`);
            newText = newText.replace(full, "[LINK_ERROR]");
        }
    }

    return newText;
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
            message_text,          // now available
        } = row;

        try {
            let sentMessageId: number;

            if (broadcast_type === "event") {
                /* no placeholders – cheap copyMessage */
                const msg = await bot.api.copyMessage(
                    user_id,
                    source_chat_id,
                    source_message_id,
                );
                sentMessageId = msg.message_id;

            } else {
                /* -------------- CSV / placeholders branch ------------------ */
                const baseText = message_text ?? "";
                const replaced = await replacePlaceholdersAndLinks(
                    baseText,
                    Number(user_id),
                    generateBroadcastGroupTitle(),
                    bot,
                );

                if (!baseText) {
                    /* text-less media – copy + edit caption */
                    const copy = await bot.api.copyMessage(
                        user_id,
                        source_chat_id,
                        source_message_id,
                    );
                    sentMessageId = copy.message_id;
                    try {
                        // first try caption
                        await bot.api.editMessageCaption(
                            user_id,                 // chat_id
                            sentMessageId,           // message_id
                            {                        // other  (3rd param)
                                caption: replaced,
                                parse_mode: "HTML",
                            },
                        );
                    } catch {
                        // if not a media message with caption, fall back to editing text
                        await bot.api.editMessageText(user_id, sentMessageId, replaced, {
                            parse_mode: "HTML",
                        });
                    }
                } else {
                    /* plain text (or media caption stored as text) */
                    const msg = await bot.api.sendMessage(user_id, replaced, {
                        parse_mode: "HTML",
                    });
                    sentMessageId = msg.message_id;
                }
            }

            await markBroadcastUserSent(bu_id, sentMessageId);
        } catch (err) {
            logger.warn(`broadcastSenderCron: error to ${user_id}: ${err}`);

            const fatal =
                isForbiddenError(err) ||
                isChatNotFoundError(err) ||
                retry_count + 1 >= 10;

            await markBroadcastUserFailed(
                bu_id,
                retry_count + 1,
                String(err),
                fatal,
            );
        }

        await delay(100); // 10 msgs/sec
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
