import { Request, Response } from "express"
import { UploadedFile } from "express-fileupload"
import fs from "fs"
import QRCode from "qrcode"
import sharp from "sharp"
import { Context, Telegraf, TelegramError } from "telegraf"
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
      baseImagePath = "./img/onton.png";
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
  const { message , fileName } = req.body; // Assuming the custom message is sent in the request body
  // Custom function to sanitize the file name
  const sanitizeFileName = (name: string) => {
    return name.replace(/[^a-zA-Z0-9._-]/g, "_"); // Replace invalid characters with underscore
  };
  if (!id || typeof id !== "string") {
    return res.status(400).send("User ID is required");
  }

  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send("No files were uploaded.");
  }

  // Ensure the file is correctly typed as UploadedFile (not an array of files)
  const file = req.files.file as UploadedFile; // Adjust if supporting multiple files

  // Set the default caption if none is provided
  const caption = message || "📄 Here is your file.";
  // Sanitize the file name
  const sanitizedFileName = sanitizeFileName(fileName || "visitors");

  try {
    // Ensure 'file.data' is used, which is a Buffer
    // @ts-expect-error fix express.d.ts
    await req.bot.telegram.sendDocument(
        id,
        { source: file.data, filename: `${sanitizedFileName}.csv` }, // 'file.data' is the Buffer you need
        { caption: caption }, // Use the provided caption or the default
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
    res: Response
) => {
  const { id, user_id, url, share_link, custom_button } = req.body;

  if (typeof id === "string" && typeof user_id === "string" && typeof url === "string" && typeof share_link === "string") {
    try {
      const event = await getEvent(id);
      console.log("event", event.title);
      console.log("id", id, "user_id", user_id, "url", url, event.image_url);

      // Ensure that start_date and end_date are numbers
      const startDateInSeconds = Number(event.start_date);
      const endDateInSeconds = Number(event.end_date);

      if (isNaN(startDateInSeconds) || isNaN(endDateInSeconds)) {
        throw new Error("Invalid date values.");
      }

      // Convert start and end dates from seconds to Date format
      const startDate = new Date(startDateInSeconds * 1000).toLocaleString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      const endDate = new Date(endDateInSeconds * 1000).toLocaleString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      // Determine the custom button, default to "Buy Ticket" button if none is provided
      const defaultButton = { text: "Buy Ticket", web_app: { url } };
      const customButton = custom_button || defaultButton;

        await req.bot.telegram.sendPhoto(
          parseInt(user_id),
          {
            url: event.image_url,
          },
          {
            caption: `
📄 <b>${event.title}</b>
▫️ <i>${event.subtitle}</i>

🗓 Starts at: ${startDate}
🗓 Ends at: ${endDate}

🔗 Link: ${share_link}
`,
            parse_mode: "HTML",
            reply_markup: {
              inline_keyboard: [[customButton]], // Use the custom button or default
            },
          }
      );


      res.json(event);
    } catch (error) {
      console.log(error);
      res.status(404).json({ message: "Event not found" });
    }
  } else {
    res.status(400).json({ message: "Invalid query id" });
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
  tryCount?: number
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
    if (error instanceof TelegramError && error.code === 429 && tryCount < 10) {
      console.error("TELEGRAF_ERROR: 429", error);

      // wait 1000
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await sendMessage(req, res, tryCount ? tryCount + 1 : 1);
    }

    // Differentiate between Telegram API errors and other errors
    if (error.response?.statusCode) {
      // Handle errors from the Telegram API (e.g., invalid chat_id, bot token issues)
      const errorMessage = error.response.description || "An error occurred while sending the message.";
      console.error('TELEGRAM_ERROR:', errorMessage);
      return res.status(error.response.statusCode).json({
        success: false,
        error: errorMessage,
      });
    }

    // Handle other unexpected errors
    console.error("Unexpected error sending message:", error);
    return res.status(500).json({
      success: false,
      error: "Unexpected server error. Please try again later.",
    });
  }
}
