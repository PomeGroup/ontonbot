import { Request, Response } from "express";
import { Bot, InputFile } from "grammy";
import { UploadedFile } from "express-fileupload";
import { logger } from "../utils/logger";

export const handleFileSend = async (
  req: Request & { bot: Bot },
  res: Response,
) => {
  const { id } = req.query;
  const { message, fileName } = req.body; // Assuming the custom message is sent in the request body
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
    const dataFile = new InputFile(file.data, `${sanitizedFileName}.csv`);
    await req.bot.api.sendDocument(
      id,
      dataFile,
      { caption: caption }, // Use the provided caption or the default
    );

    return res.status(200).send("Success");
  } catch (error) {
    logger.error(error);
    return res.status(500).send("Internal Server Error");
  }
};
