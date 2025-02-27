import { Request, Response } from "express";
import { Bot, InputFile } from "grammy";
import QRCode from "qrcode";
import sharp from "sharp";
import fs from "fs";
import { shareKeyboard } from "../markups";
import { logger } from "../utils/logger";

export const handleSendQRCode = async (
  req: Request & { bot: Bot },
  res: Response,
) => {
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

    const imageFile = new InputFile(imageToSend);
    // Send the combined image
    await req.bot.api.sendPhoto(id, imageFile, {
      caption: `🔗 Scan QR code or share the link:\n\n${url.replace(
        "https://",
        "",
      )}`,
      reply_markup: shareKeyboard(url),
    });

    return res.status(200).send("Success");
  } catch (error) {
    logger.error(error);
    return res.status(500).send("Internal Server Error");
  }
};

