import { Request, Response } from "express";
import { Bot } from "grammy";
import { logger } from "../utils/logger";
import { getEvent } from "../db/db";

export const handlePhotoMessage = async (
  req: Request & {
    bot: Bot;
  },
  res: Response,
) => {
  const { id, user_id, message } = req.body;

  if (
    typeof id === "string" &&
    typeof user_id === "string" &&
    typeof message === "string"
  ) {
    try {
      logger.log(
        "<----------------------> handlePhotoMessage , ",
        id,
        user_id,
        message,
      );
      const event = await getEvent(id);
      try {
        await req.bot.api.sendPhoto(parseInt(user_id), event.image_url, {
          caption: message,
          parse_mode: "HTML",
        });
      } catch (error) {
        logger.log("<----------------------> handlePhotoMessage", error);
      }

      res.json(event);
    } catch (error) {
      logger.log("error_handlePhotoMessage", error);
      res.status(404).json({ message: "Event not found" });
    }
  } else {
    res.status(400).json({ message: "Invalid query id" });
  }
};