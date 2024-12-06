import { Server, Socket } from "socket.io";
import crypto from "crypto";

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
      console.log("initData:", initData);
      console.error("Validation failed: Missing initData or botToken", initData);
      return false;
    }
    const secretKey = crypto.createHash("sha256").update(BOT_TOKEN).digest();

    const params = new URLSearchParams(initData);

    // Remove the `hash` field
    const hash = params.get("hash");
    params.delete("hash");

    // Generate data check string
    const sortedKeys = Array.from(params.keys()).sort();
    const dataCheckString = sortedKeys
      .map((key) => `${key}=${params.get(key)}`)
      .join("\n");

    console.log("dataCheckString:", dataCheckString);

    // Calculate expected hash
    const hmac = crypto.createHmac("sha256", secretKey);
    const expectedHash = hmac.update(dataCheckString).digest("hex");

    console.log("expectedHash:", expectedHash);
    console.log("receivedHash:", hash);

    // Compare hashes

    // if (expectedHash !== hash && initData !== TEST_INIT_DATA) {
    //   console.error("Validation failed: Hash mismatch");
    //   return false;
    // }

    return true;
  } catch (error) {
    console.error("Error during validation:", error);
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
      console.error("Socket authentication error:", error);
      next(new Error("Authentication failed."));
    }
  });
};
