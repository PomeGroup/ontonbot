import { sendHttpRequest } from "@/lib/httpHelpers";
import { configProtected } from "@/server/config";
import { logger } from "@/server/utils/logger";

/*
-- Example for 'development' environment
INSERT INTO "public"."onton_setting" ("env", "var", "value", "protected")
VALUES
  (
    'development',
    'PRIDIPIE_API',
    '["https://backendi.predipie.com/", "your-api-key-here"]',
    't'
  );
 */

/**
 * Example function to call Pridipie’s /api/v1/auth/onton endpoint
 * with `telegramId` in the body and an `api-key` header.
 */
export const PridipieAUTH = async (payload: { telegramId: string }): Promise<{ success: boolean; data: any }> => {
  // Read base URL & API key from your config
  const BaseUrl = configProtected?.PRIDIPIE_API?.[0] || "";
  const ApiKey = configProtected?.PRIDIPIE_API?.[1] || "";

  // Construct the final endpoint
  const endpoint = BaseUrl + "api/v1/auth/onton";
  logger.log(`Calling Pridipie endpoint: ${endpoint}`);

  // Prepare headers with the API key
  const headers = {
    "Content-Type": "application/json",
    "api-key": ApiKey,
  };

  try {
    // For this endpoint, you only need the telegramId in the body.
    // If you also needed to pass the API key in the body, you could merge it as well.
    const { success, data } = await sendHttpRequest("POST", endpoint, headers, payload);

    // Check if the response indicates success
    // The sample JSON shows a `username` in a successful response
    if (!data?.username) {
      logger.error("Failed to add user via Pridipie:", data);
      return { success: false, data };
    }

    // Otherwise assume success if it returns a username
    return { success: true, data };
  } catch (err: any) {
    logger.error("Error calling Pridipie API:", err);
    return { success: false, data: { error: err.message } };
  }
};
