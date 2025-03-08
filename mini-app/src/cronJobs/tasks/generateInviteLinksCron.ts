import { logger } from "@/server/utils/logger";
import {
  callCreateInviteLink,
  callDeleteInviteLink,
  callCheckBotAdmin, // <--- You add or import this
} from "@/lib/tgBot";

// Import the separate DB methods:
import { fetchUpcomingEventsWithGroup } from "@/server/db/events";
import { eventRegistrantsDB } from "@/server/db/eventRegistrants.db";

/**
 * This cron job:
 * 1) Finds upcoming events (start_date > now, have a telegram group)
 * 2) Checks if the bot is an admin in that group
 * 3) Revokes links for rejected users who still have a stored link
 * 4) Creates new invite links for approved/checkedin users who have no link
 */
export const generateInviteLinksCron = async () => {
  try {
    const nowInSeconds = Math.floor(Date.now() / 1000);

    // 1) Fetch future events that have event_telegram_group AND start_date > now
    const upcomingEvents = await fetchUpcomingEventsWithGroup(nowInSeconds);

    if (!upcomingEvents.length) {
      logger.log("No upcoming events with telegram group. Nothing to do.");
      return;
    }

    for (const evt of upcomingEvents) {
      const chatId = evt.eventTelegramGroup; // The group ID
      if (!chatId) continue; // Just in case

      const eventUuid = evt.event_uuid;

      // 2) Check if the bot is an admin in this group
      let isAdmin = false;
      try {
        const adminCheckResult = await callCheckBotAdmin(chatId);
        // Expect something like: { success: true/false, chatInfo: {...} }
        if (adminCheckResult?.success) {
          isAdmin = true;
        }
      } catch (err) {
        logger.error(`Failed to check bot admin status for chatId ${chatId}, eventUuid ${eventUuid}:`, err);
      }

      if (!isAdmin) {
        logger.warn(`Bot is not admin in chat ${chatId}, skipping event ${eventUuid}.`);
        continue; // Skip this event
      }

      // 3) Handle REJECTED but still have an invite link => revoke it
      const rejectedUsersWithLink = await eventRegistrantsDB.fetchRejectedUsersWithLink(eventUuid);

      for (const reg of rejectedUsersWithLink) {
        const oldInviteLink = reg.telegram_invite_link!;
        try {
          // Call your Telegram Bot service to DELETE the link
          const revokeResult = await callDeleteInviteLink(chatId, oldInviteLink);
          if (revokeResult.success) {
            // If success, update DB and remove the link
            await eventRegistrantsDB.clearInviteLink(reg.id);
            logger.log(`Revoked link for user_id=${reg.user_id} event=${eventUuid}`);
          }
        } catch (err) {
          logger.error(`Failed to revoke link for user_id=${reg.user_id} event=${eventUuid}:`, err);
        }
      }

      // 4) Handle APPROVED/CHECKEDIN but have NO invite link => create a new link
      const needInviteLink = await eventRegistrantsDB.fetchNeedInviteLink(eventUuid);

      for (const reg of needInviteLink) {
        try {
          // Call your Telegram Bot to CREATE a link
          const createResult = await callCreateInviteLink(chatId, {
            creates_join_request: false,
            name: `Event_${eventUuid}_User_${reg.user_id}`,
          });

          if (createResult.success && createResult.invite_link) {
            // Store the new link in the database
            await eventRegistrantsDB.setInviteLink(reg.id, createResult.invite_link);
            logger.log(`Created invite link for user_id=${reg.user_id} event=${eventUuid}`);
          }
        } catch (err) {
          logger.error(`Failed to create link for user_id=${reg.user_id} event=${eventUuid}:`, err);
        }
      }
    }

    logger.log("generateInviteLinksCron completed.");
  } catch (error) {
    logger.error("Error in generateInviteLinksCron:", error);
  }
};
