import { Request, Response } from "express"
import { UploadedFile } from "express-fileupload"
import fs from "fs"
import QRCode from "qrcode"
import sharp from "sharp"
import { Context, Telegraf } from "telegraf"
import { Update } from "telegraf/typings/core/types/typegram"
import { getEvent } from "./db/db"
import { shareKeyboard } from "./markups"

export const handleSendQRCode = async (req, res) => {
  const { url, hub, id } = req.query;

  if (!url || typeof url !== "string" || !id || typeof id !== "string") {
    return res.status(400).send("URL is required");
  }

  try {
    // Generate QR code with transparent background
    const qrBuffer = await QRCode.toBuffer(url, {
      color: {
        dark: "#000000", // QR code color
        light: "#0000", // Transparent background
      },
      errorCorrectionLevel: "H",
    });

    // Resize QR code to fit well on the base image
    const resizedQRBuffer = await sharp(qrBuffer)
      .resize(700, 700) // Adjust this value as needed
      .png() // Ensure the output is PNG to maintain transparency
      .toBuffer();

    // Determine the base layer image path
    let baseImagePath = `./img/${hub === "Hong Kong" ? "SEA" : hub}.png`;
    if (!fs.existsSync(baseImagePath)) {
      baseImagePath = "./img/society.png";
    }

    // Read the base layer image into a buffer
    const baseImageBuffer = fs.readFileSync(baseImagePath);

    // Combine the base layer and resized QR code with the QR code in the center
    const imageToSend = await sharp(baseImageBuffer)
      .composite([{ input: resizedQRBuffer, gravity: "center" }])
      .toBuffer();

    // Send the combined image
    await req.bot.telegram.sendPhoto(
      id,
      { source: imageToSend },
      {
        caption: `🔗 Scan QR code or share the link:\n\n${url.replace("https://", "")}`,
        reply_markup: { inline_keyboard: shareKeyboard(url) },
      },
    );

    return res.status(200).send("Success");
  } catch (error) {
    console.error(error);
    return res.status(500).send("Internal Server Error");
  }
};

export const handleFileSend = async (req: Request, res: Response) => {
  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).send("User ID is required");
  }

  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send("No files were uploaded.");
  }

  // Ensure the file is correctly typed as UploadedFile (not an array of files)
  const file = req.files.file as UploadedFile; // Adjust if supporting multiple files

  try {
    // Ensure 'file.data' is used, which is a Buffer
    // @ts-expect-error fix express.d.ts
    await req.bot.telegram.sendDocument(
      id,
      { source: file.data, filename: "visitors.csv" }, // 'file.data' is the Buffer you need
      { caption: "📄 Here is your file." },
    );

    return res.status(200).send("Success");
  } catch (error) {
    console.error(error);
    return res.status(500).send("Internal Server Error");
  }
};

export const handleShareEvent = async (
  req: Request & {
    bot: Telegraf<Context<Update>>;
  },
  res: Response,
) => {
  const { id, user_id, url } = req.body;

  if (
    typeof id === "string" &&
    typeof user_id === "string" &&
    typeof url === "string"
  ) {
    try {
      const event = await getEvent(id);
      await req.bot.telegram.sendPhoto(
        parseInt(user_id),
        {
          url: event.image_url,
        },
        {
          caption: `
<b>${event.title}</b>
${event.subtitle}`,
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "Buy Ticket",
                  web_app: { url },
                },
              ],
            ],
          },
        },
      );

      res.json(event);
    } catch (error) {
      console.log(error);

      res.status(404);
      res.json({ message: "event not found" });
    }
  } else {
    res.status(400);
    res.json({ message: "invalid query id" });
  }
};

interface SendRewardLinkBody {
  chat_id: number;
  link: string;
  custom_message: string;
}

/**
 * Sends a message to a Telegram chat.
 *
 * @param {Request & { bot: Telegraf<Context<Update>> }} req - The request object.
 * @param {Response} res - The response object.
 * @return {Promise<Response>} The response object.
 */
export async function sendMessage(
  req: Request & { bot: Telegraf<Context<Update>> },
  res: Response,
): Promise<Response> {
  try {
    // Destructure the request body
    const { chat_id, link, custom_message }: SendRewardLinkBody = req.body;

    // Input validation
    if (!chat_id || typeof Number(chat_id) !== "number") {
      // Return an error response if chat_id is invalid or missing
      return res.status(400).json({ error: "Invalid or missing chat_id" });
    }
    if (link && (typeof link !== "string" || !link?.startsWith("http"))) {
      // Return an error response if link is invalid
      return res.status(400).json({ error: "Invalid link" });
    }
    if (!custom_message || typeof custom_message !== "string") {
      // Return an error response if custom_message is missing or invalid
      return res.status(400).json({ error: "Invalid custom_message" });
    }

    // Create the reply_markup object if link is provided
    const reply_markup = link ? {
      inline_keyboard: [
        [
          {
            text: "Claim Reward",
            url: link,
          },
        ],
      ],
    } : undefined;

    // Send the message to the chat
    await req.bot.telegram.sendMessage(chat_id, custom_message.trim(), { reply_markup, parse_mode: "HTML"});

    // Return a success response
    return res.status(200).json({
      success: true,
      message: "Message sent successfully",
    });
  } catch (error) {
    // Log and return an error response if an error occurs
    console.error("Error sending message:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}
