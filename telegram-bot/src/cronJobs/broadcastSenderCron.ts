// cron/broadcastSenderCron.ts
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

import {
    AFFILIATE_PLACEHOLDERS,
    INVITE_PLACEHOLDER_REGEX,
    additionalRecipients,
} from "../constants";

import {
    generateBroadcastGroupTitle,
    normalizeDashes,
    extractInviteChatIds,
    escapeCsv,
} from "../utils/utils";

import {
    getOrCreateSingleInviteLinkForUserAndChat,
} from "../db/db";
import { getOrCreateSingleAffiliateLink } from "../db/affiliateLinks";

import { Readable } from "stream";
import { InputFile } from "grammy";

/* ------------------------------------------------------------------ */
/* main cron                                                          */
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
            message_text,           // caption/text as stored
        } = row;

        try {
            /* ------------------------------------------------------------ */
            /* 1. build personalised caption if this is a CSV broadcast     */
            /* ------------------------------------------------------------ */
            let captionOpts: Parameters<Bot["api"]["copyMessage"]>[3] | undefined;
            if (broadcast_type === "csv" && message_text) {
                const replaced = await personalise(
                    message_text,
                    Number(user_id),
                    bot,
                );
                captionOpts = { caption: replaced, parse_mode: "HTML" };
            }

            /* ------------------------------------------------------------ */
            /* 2. copy the original message (photo/video/doc/…)             */
            /*    - with caption override when captionOpts is defined       */
            /* ------------------------------------------------------------ */
            const copy = await bot.api.copyMessage(
                user_id,
                source_chat_id,
                source_message_id,
                captionOpts,
            );
            const sentMessageId = copy.message_id;

            /* ------------------------------------------------------------ */
            /* 3. mark success                                              */
            /* ------------------------------------------------------------ */
            await markBroadcastUserSent(bu_id, sentMessageId);
            logger.info(
                `broadcastSenderCron: sent to ${user_id} (bu_id=${bu_id}, bid=${broadcast_id})`,
            );

        } catch (err) {
            /* copyMessage failed → handle retries / fatal */
            logger.warn(`broadcastSenderCron: copy error to ${user_id}: ${err}`);

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

        await delay(50);               // 10 msgs/sec
    }

    /* notify admins if any broadcast finished */
    const touched = new Set<number>(rows.map((r) => r.broadcast_id));

    for (const bid of Array.from(touched)) {
        if (await broadcastHasPendingUsers(bid)) continue;
        await notifyAdminsAboutFinishedBroadcast(bot, bid);
    }
}

/* ------------------------------------------------------------------ */
/* personalise placeholders                                           */
/* ------------------------------------------------------------------ */
async function personalise(
    baseText: string,
    userId: number,
    bot: Bot,
): Promise<string> {
    let text = normalizeDashes(baseText);
    const broadcastGroupTitle = generateBroadcastGroupTitle();

    /* affiliate placeholders */
    for (const ph of AFFILIATE_PLACEHOLDERS) {
        if (!text.includes(ph)) continue;
        const itemType = ph.replace(/[{}]/g, "");
        const baseTitle = `broadcast-${itemType}-${userId}`;
        try {
            const linkRow = await getOrCreateSingleAffiliateLink(
                userId,
                itemType,
                baseTitle,
                broadcastGroupTitle,
            );
            const link = `https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME}/event?startapp=campaign-aff-${linkRow.link_hash}`;
            text = text.replace(ph, link);
        } catch (e) {
            logger.error(`afflink err uid=${userId}: ${e}`);
            text = text.replace(ph, "[LINK_ERROR]");
        }
    }

    /* invite placeholders */
    for (const chatId of extractInviteChatIds(text)) {
        const placeholder = `{invite:${chatId}}`;
        try {
            const link = await getOrCreateSingleInviteLinkForUserAndChat(
                bot.api,
                userId,
                chatId,
            );
            text = text.replace(placeholder, link);
        } catch (e) {
            logger.warn(`invite err uid=${userId} chat=${chatId}: ${e}`);
            text = text.replace(placeholder, "[LINK_ERROR]");
        }
    }

    return text;
}

/* ------------------------------------------------------------------ */
/* finished-broadcast report                                          */
/* ------------------------------------------------------------------ */
async function notifyAdminsAboutFinishedBroadcast(bot: Bot, broadcastId: number) {
    const { source_chat_id, source_message_id } = await getBroadcastMeta(broadcastId);
    const success = await countBroadcastSuccess(broadcastId);
    const errors  = await fetchBroadcastErrors(broadcastId);

    const summary =
        `Broadcast #${broadcastId} finished.\n- Success: ${success}\n- Errors: ${errors.length}`;

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

        const csv =
            ["user_id,error", ...errors.map((e) => `${e.user_id},${escapeCsv(e.last_error)}`)].join("\n");
        const file = new InputFile(Readable.from(csv), "broadcast_errors.csv");

        try {
            await bot.api.sendDocument(adminId, file, {
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
    return err instanceof GrammyError
        ? err.error_code === 403
        : /403|forbidden/i.test(String(err));
}

function isChatNotFoundError(err: unknown) {
    return err instanceof GrammyError
        ? err.error_code === 400 && /chat (?:not )?found/i.test(err.description)
        : /chat (?:not )?found/i.test(String(err));
}

function delay(ms: number) {
    return new Promise<void>((r) => setTimeout(r, ms));
}
