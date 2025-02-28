import { Context } from "grammy";
import { API_BASE_URL, BOT_TOKEN, JWT_SECRET, MS_PER_REQUEST, REQUESTS_PER_SECOND } from "../constants";
import { getAdminOrganizerUsers, isUserAdmin, updateUserProfile } from "../db/db";
import { logger } from "../utils/logger";
import axios from "axios";
import { uploadProfileImage } from "../utils/uploadProfileImage";

export async function updateAdminOrganizerProfilesHandler(ctx: Context) {
  // 1. Only allow admins to run
  if (BOT_TOKEN === "" || JWT_SECRET === "" || API_BASE_URL === "") {
    return ctx.reply("Please set up the environment variables first.");
  }
  if (REQUESTS_PER_SECOND === undefined || MS_PER_REQUEST === undefined) {
    return ctx.reply("Please set up the rate limit first.");
  }
  const { isAdmin } = await isUserAdmin(ctx.from?.id.toString() || "");
  if (!isAdmin) {
    return ctx.reply("You are not authorized to run this command.");
  }

  try {
    // 2. Fetch admin/organizer users from DB
    const users = await getAdminOrganizerUsers();
    if (!users.length) {
      return ctx.reply("No admin/organizer users found.");
    }

    await ctx.reply(`Starting profile updates for ${users.length} users...`);

    // 3. Process each user with rate limiting
    for (let i = 0; i < users.length; i++) {
      const userRow = users[i];
      const userId = Number(userRow.user_id);
      logger.log(`Updating profile for user ${userId}...`);

      // ~200ms delay between requests => ~5 rps
      await new Promise((resolve) => setTimeout(resolve, MS_PER_REQUEST));

      try {
        // 3a. Check if user blocked the bot
        const chat = await ctx.api.getChat(userId);
        // If successful, user hasn't blocked the bot:
        let allowsWriteToPm = true;
        let isPremium = false;

        // Telegram's "is_premium" is sometimes present on private chats
        if (chat.type === "private" && (chat as any).is_premium === true) {
          isPremium = true;
        }

        // 3b. Get the user's first profile photo
        const photosResult = await ctx.api.getUserProfilePhotos(userId, {
          limit: 1,
        });
        let finalPhotoUrl: string | undefined;

        if (photosResult.total_count > 0) {
          // photosResult.photos is an array of arrays, each array = sizes of the same photo
          // We only care about the **first** photo set => photos[0]
          // The largest version is the last item in that array
          const firstPhotoSet = photosResult.photos[0];
          const largestPhoto = firstPhotoSet[firstPhotoSet.length - 1];
          const fileId = largestPhoto.file_id;

          // 3c. Get the file path from Telegram
          const fileInfo = await ctx.api.getFile(fileId);
          const filePath = fileInfo.file_path; // e.g. "photos/file_10.jpg"

          if (filePath) {
            // 3d. Download the file from Telegram into a buffer
            const tgFileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`;
            const downloadRes = await axios.get(tgFileUrl, {
              responseType: "arraybuffer",
            });
            const buffer = Buffer.from(downloadRes.data); // image buffer

            // 3e. Upload this file buffer to your external system
            //     We'll place it in the "profiles" folder
            const photoUrlFromUploader = await uploadProfileImage(
              buffer,
              "image/jpeg",
            );

            // That URL from your upload endpoint is what we'll store in DB
            finalPhotoUrl = photoUrlFromUploader;
          }
        }

        // 3f. Update the DB with these fields
        await updateUserProfile(userId, {
          isPremium,
          allowsWriteToPm,
          photoUrl: finalPhotoUrl,
          hasBlockedBot: false,
        });

        logger.log(`User ${userId} profile updated with an uploaded photo.`);
      } catch (error: any) {
        // 4. If it's a 403 => the user blocked the bot
        if (
          error?.error_code === 403 &&
          /bot was blocked by the user/i.test(error.description)
        ) {
          await updateUserProfile(userId, { hasBlockedBot: true });
          logger.log(`User ${userId} blocked the bot. Updated in DB.`);
        } else {
          logger.error(`Error updating user ${userId}:`, error);
        }
      }
    }

    await ctx.reply("Profile updates complete.");
  } catch (error) {
    logger.error("Error in updateAdminOrganizerProfilesHandler:", error);
    await ctx.reply("An error occurred while updating profiles.");
  }
}
