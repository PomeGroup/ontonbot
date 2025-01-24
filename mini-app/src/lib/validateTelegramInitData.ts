import { logger } from "@/server/utils/logger";
import { validateMiniAppData } from "@/utils";


const BOT_TOKEN = process.env.BOT_TOKEN || ""; // Use your bot token here
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
export const validateTelegramInitData = (initData: string): {valid: boolean, initDataJson: any} => {
  try {
    if (initData === undefined || BOT_TOKEN === undefined || BOT_TOKEN === "" || initData === "") {
      logger.log("initData:", initData);
      logger.error("Validation failed: Missing initData or botToken", initData);
      return {valid: false, initDataJson: {}};
    }
    const  validationResponse = validateMiniAppData(initData);
    if (!validationResponse.valid) {
      logger.error(`Validation failed: Invalid initData for user ${validationResponse.initDataJson.user.id}`);
      return {valid: false, initDataJson: {}};
    }
    else if( validationResponse.valid) {
      logger.log(`Validation passed: Valid initData for user ${validationResponse.initDataJson.user.id}`);
      return {valid: true, initDataJson: validationResponse.initDataJson};
    }
    // it should never reach here but just in case it does it mean validation failed
    return {valid: false, initDataJson: {}};

  } catch (error) {
    logger.error("Error during validation:", error);
    return  {valid: false, initDataJson: {}};
  }
};