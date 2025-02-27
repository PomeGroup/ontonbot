// In your telegram-bot service, similarly to handleShareEvent:
import { Bot, InputFile } from "grammy";
import { Request, Response } from "express";
import { processImageBuffer } from "../helpers/processImageBuffer";
import { logger } from "../utils/logger";
import axios from "axios";

export const handleShareOrganizer = async (
  req: Request & { bot: Bot },
  res: Response,
) => {
  const { organizer_id, requesting_user, share_link, url, organizer_data } = req.body;

  if (typeof organizer_id !== "string" || typeof requesting_user !== "string") {
    return res.status(400).json({ message: "Invalid organizer or user ID" });
  }


  try {
    // Destructure relevant fields
    const {
      org_channel_name,
      org_image, // Could be a string (URL) or { type: 'Buffer', data: [...] }
    } = organizer_data || {};

    const caption = `
<b>🔸${org_channel_name || "Organizer Profile"}</b>

Take a look at my events in my channel on ONTON

Address:  ${share_link}
`;

    // Build an inline keyboard
    const inline_keyboard = [[
      {
        text: "Open Organizer Page",
        web_app: { url },
      },
    ]];

    let photoToSend: string | InputFile;

    // If org_image is a JSON-serialized buffer => convert & resize
    if (
      org_image &&
      typeof org_image === "object" &&
      org_image.type === "Buffer" &&
      Array.isArray(org_image.data)
    ) {
      try {
        const realBuffer = Buffer.from(org_image.data);
        const processed = await processImageBuffer(realBuffer);
        photoToSend = new InputFile(processed);
      } catch (err) {
        logger.error("Error processing buffer image:", err);
        photoToSend = "https://onton.live/template-images/default.webp";
      }
    }
    // If org_image is a string => assume it's a URL => fetch & resize
    else if (typeof org_image === "string" && org_image.trim()) {
      try {
        const { data } = await axios.get<ArrayBuffer>(org_image, {
          responseType: "arraybuffer",
          headers: { Accept: "image/*" },
        });
        const buffer = Buffer.from(data);
        const processed = await processImageBuffer(buffer);
        photoToSend = new InputFile(processed);
      } catch (err) {
        logger.error("Error fetching/processing image URL:", err);
        photoToSend = "https://onton.live/template-images/default.webp";
      }
    }
    // Otherwise, fallback to a default
    else {
      photoToSend = "https://onton.live/template-images/default.webp";
    }

    // Send the photo to Telegram
    await req.bot.api.sendPhoto(parseInt(requesting_user, 10), photoToSend, {
      caption,
      parse_mode: "HTML",
      reply_markup: { inline_keyboard },
    });

    return res.json({ success: true });
  } catch (error) {
    logger.error("Error sharing organizer:", error);
    return res.status(500).json({ message: "Failed to share organizer" });
  }
};

