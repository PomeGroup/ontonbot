import { Bot, InputFile } from "grammy";
import axios from "axios";
import sharp from "sharp";
import { logger } from "../utils/logger";

export const processAndSendImage = async (
  event: any,
  userId: string,
  bot: Bot,
  startDate: string,
  endDate: string,
  shareLink: string,
  customButton: any,
) => {
  try {
    // Download the image with proper headers
    const imageResponse = await axios.get(event.image_url, {
      responseType: "arraybuffer",
      headers: {
        Accept: "image/*",
      },
    });

    // Create a sharp instance with the downloaded image
    let imageProcess = sharp(Buffer.from(imageResponse.data));

    try {
      // Get image metadata
      const metadata = await imageProcess.metadata();

      // Process the image if width > 1920
      if (metadata.width && metadata.width > 1920) {
        imageProcess = imageProcess.resize(1920, null, {
          fit: "inside",
          withoutEnlargement: true,
        });
      }

      // Convert to JPEG format to ensure compatibility
      const processedBuffer = await imageProcess
        .jpeg({
          quality: 85,
          force: false,
        })
        .toBuffer();

      const imageFile = new InputFile(processedBuffer);
      // Send the processed image
      await bot.api.sendPhoto(parseInt(userId), imageFile, {
        caption: `
📄 <b>${event.title}</b>
👉 <i>${event.subtitle}</i>

🗓 Starts at: ${startDate}

🗓 Ends at: ${endDate}

🔗 Link: ${shareLink}
`,
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [[customButton]],
        },
      });
    } catch (sharpError) {
      logger.error("Sharp processing error:", sharpError);
      throw new Error("Image processing failed");
    }
  } catch (error) {
    logger.error("Image processing/sending error:", error);

    // Fall back to sending the original URL if processing fails
    await bot.api.sendPhoto(parseInt(userId), event.image_url, {
      caption: `
📄 <b>${event.title}</b>
👉 <i>${event.subtitle}</i>

🗓 Starts at: ${startDate}

🗓 Ends at: ${endDate}

🔗 Link: ${shareLink}
`,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [[customButton]],
      },
    });
  }
};

