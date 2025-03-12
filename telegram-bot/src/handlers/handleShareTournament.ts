import { Bot, InputFile } from "grammy";
import { Request, Response } from "express";
import axios from "axios";
import { processImageBuffer } from "../helpers/processImageBuffer";
import { logger } from "../utils/logger";

/**
 * POST /share-tournament
 * Body:
 * {
 *   "requesting_user": "123456789",     // Telegram user ID (as string)
 *   "share_link": "https://my.link",   // Where to open
 *   "url": "https://webapp.link",      // Web App link or fallback
 *   "tournament_data": {
 *      "name": "...",
 *      "imageUrl": "...", // string or { type: "Buffer", data: [...] }
 *      "startDate": 1691130930, // epoch or raw
 *      "endDate": 1691139930,
 *      "state": "Active",
 *      "entryFee": 10000000,
 *      ...
 *   }
 * }
 */
export async function handleShareTournament(
  req: Request & { bot: Bot },
  res: Response,
) {
  const { requesting_user, share_link, url, tournament_data } = req.body;

  // 1) Validate input
  if (typeof requesting_user !== "string") {
    return res.status(400).json({ message: "Invalid requesting_user" });
  }
  if (!tournament_data || typeof tournament_data !== "object") {
    return res.status(400).json({ message: "Missing or invalid tournament_data" });
  }

  try {
    const {
      name,
      imageUrl, // Could be a buffer-like or a string
      startDate,
      endDate,
      state,
      entryFee,
      // ... any other fields you want to show
    } = tournament_data;

    // 2) Build your message caption
    // Example of using emojis and HTML
    const caption = `
<b>🏆 ${name || "Tournament"}</b>

⏰ <b>Start:</b> ${formatDate(startDate)}
⏰ <b>End:</b>   ${formatDate(endDate)}
<b>State:</b>   ${state || "?"}
<b>Entry Fee:</b> ${entryFee ? String(entryFee) : "Free"}

Join here: ${share_link}
`;

    // 3) Inline keyboard with e.g. a single "Open" button
    const inline_keyboard = [[
      {
        text: "Open Tournament",
        web_app: { url },
      },
    ]];

    // 4) Resolve the tournament image => get final photoToSend
    let photoToSend: string | InputFile;
    photoToSend = await fetchOrProcessTournamentImage(imageUrl);

    // 5) Send the photo
    await req.bot.api.sendPhoto(parseInt(requesting_user, 10), photoToSend, {
      caption,
      parse_mode: "HTML",
      reply_markup: { inline_keyboard },
    });

    return res.json({ success: true });
  } catch (error) {
    logger.error("Error sharing tournament:", error);
    return res.status(500).json({ message: "Failed to share tournament" });
  }
}

/* -------------------------------------------------------------------------- */
/*                   Helper function to format a date (epoch)                 */

/* -------------------------------------------------------------------------- */
function formatDate(epochOrNum: number | string | undefined): string {
  if (!epochOrNum) return "N/A";
  const epoch = Number(epochOrNum);
  if (Number.isNaN(epoch)) return "N/A";
  const d = new Date(epoch * 1000); // if your epoch is in seconds
  return d.toLocaleString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* -------------------------------------------------------------------------- */
/*   Helper to handle image logic (similar to your handleShareOrganizer)      */

/* -------------------------------------------------------------------------- */
async function fetchOrProcessTournamentImage(
  imageCandidate: any, // can be string or { type: "Buffer", data: [...] }
): Promise<string | InputFile> {

  // 1) If it's a buffer-like object
  if (
    imageCandidate &&
    typeof imageCandidate === "object" &&
    imageCandidate.type === "Buffer" &&
    Array.isArray(imageCandidate.data)
  ) {
    try {
      const realBuffer = Buffer.from(imageCandidate.data);
      const processed = await processImageBuffer(realBuffer);
      return new InputFile(processed);
    } catch (err) {
      logger.error("Error processing buffer image:", err);
      return "https://onton.live/template-images/default.webp";
    }
  }

  // 2) If it's a string => treat as URL => fetch & resize
  if (typeof imageCandidate === "string" && imageCandidate.trim()) {
    try {
      const { data } = await axios.get<ArrayBuffer>(imageCandidate, {
        responseType: "arraybuffer",
        headers: { Accept: "image/*" },
      });
      const buffer = Buffer.from(data);
      const processed = await processImageBuffer(buffer);
      return new InputFile(processed);
    } catch (err) {
      logger.error("Error fetching/processing image URL:", err);
      return "https://onton.live/template-images/default.webp";
    }
  }

  // 3) Otherwise, fallback
  return "https://onton.live/template-images/default.webp";
}
