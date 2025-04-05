import { Bot, InputFile } from "grammy";
import { Request, Response } from "express";
import { logger } from "../utils/logger";
import axios from "axios";

export async function handleShareAffiliateLink(req: Request & { bot: Bot }, res: Response) {
  const { requesting_user, link_hash, share_link, fallback_url, affiliate_data } = req.body;

  if (!requesting_user || !link_hash || !affiliate_data) {
    return res.status(400).json({ message: "Missing data" });
  }

  try {
    const { imageUrl, totalSpins } = affiliate_data;

    // Build your message text
    const caption = `
<b>🍃 Onion Genesis 🍃</b>

Hey there! Don’t miss your chance to join our exclusive onion token airdrop.
Buy your Onion Genesis Campaign spin package now and secure your spot in the next big airdrop event!

Tap the link below to get started:
${share_link}

Good luck and see you in the onion world! 🏆
`;

    // A single "Open" button linking to fallback_url
    const inline_keyboard = [
      [
        {
          text: "Open Link",
          web_app: { url: fallback_url },
        },
      ],
    ];

    // If you want to fetch/attach the fixed image
    let photoToSend: string | InputFile = imageUrl;
    // Optionally, if imageUrl is a direct URL, fetch & convert to a Buffer + InputFile, etc.


    // send a message with the same text without the image
    await req.bot.api.sendMessage(parseInt(requesting_user, 10), caption, {
      parse_mode: "HTML",
      reply_markup: { inline_keyboard },
      link_preview_options: {
        is_disabled: true,
      },

    });

    return res.json({ success: true });
  } catch (error) {
    logger.error("Error sharing affiliate link:", error);
    return res.status(500).json({ message: "Failed to share affiliate link" });
  }
}
