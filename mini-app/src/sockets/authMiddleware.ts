import { Server, Socket } from "socket.io";
import crypto from "crypto";
import { validateMiniAppData } from "@/utils";
import { logger } from "@/server/utils/logger";

const BOT_TOKEN = process.env.BOT_TOKEN || ""; // Use your bot token here
const TEST_INIT_DATA = process.env.TEST_INIT_DATA || ""; // Add your Telegram initData here
/**
 * Validate Telegram Web App initData
 * @param initData Query string provided by Telegram
 * @param botToken Your bot token
 * @returns Whether the initData is valid or not
 */
/**
 * Validates Telegram WebApp initData using the Bot Token.
 * @param initData - The data received in the WebApp.
 * @returns true if the validation passes, false otherwise.
 */
export const validateTelegramInitData = (initData: string): boolean => {
  try {
    if (initData === undefined || BOT_TOKEN === undefined || BOT_TOKEN === "" || initData === "") {
      logger.log("initData:", initData);
      logger.error("Validation failed: Missing initData or botToken", initData);
      return false;
    }
    const  validationResponse = validateMiniAppData(initData);
    if (!validationResponse.valid) {
      logger.error(`Validation failed: Invalid initData for user ${validationResponse.initDataJson.user.id}`);
      return false;
    }
    else if( validationResponse.valid) {
      logger.log(`Validation passed: Valid initData for user ${validationResponse.initDataJson.user.id}`);
      return true;
    }
    // it should never reach here but just in case it does it mean validation failed
    return false;

  } catch (error) {
    logger.error("Error during validation:", error);
    return false;
  }
};

export const applyAuthMiddleware = (io: Server) => {
  io.use((socket: Socket, next) => {
    try {

      const initData = socket.handshake.auth?.initData || socket.handshake?.headers["x-init-data"] || undefined;


      if (!BOT_TOKEN) {
        return next(new Error("Authentication failed: Missing BOT_TOKEN."));
      }

      if (!initData) {
        return next(new Error("Authentication failed: Missing initData."));
      }

      const isValid = validateTelegramInitData(initData);

      if (!isValid) {
        return next(new Error("Authentication failed: Invalid Telegram initData."));
      }

      const parsedData = Object.fromEntries(new URLSearchParams(initData).entries());
      const user = JSON.parse(parsedData.user || "{}");

      if (!user || !user.id) {
        return next(new Error("Authentication failed: Missing user data."));
      }

      socket.data.user = user; // Attach user data to the socket
      next();
    } catch (error) {
      logger.error("Socket authentication error:", error);
      next(new Error("Authentication failed."));
    }
  });
};
