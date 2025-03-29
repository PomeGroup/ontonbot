import axios, { AxiosError } from "axios";
import FormData from "form-data";
import { logger } from "@/server/utils/logger";

/**
 * POST CSV to Ton Society with retry:
 * /activities/{activity_id}/allowlist/telegram-ids
 * returns reward_link if successful
 *
 * If there's a 429 or 500 error, we'll retry up to 10 times,
 * sleeping 30 seconds between attempts.
 */
export async function postTelegramCsvToTonSociety(activityId: number, csvBuffer: Buffer): Promise<string | null> {
  if (!activityId) return null;

  const formData = new FormData();
  formData.append("file", csvBuffer, {
    filename: "participants.csv",
    contentType: "text/csv",
  });

  const baseUrl = process.env.TON_SOCIETY_BASE_URL || "";
  const apiKey = process.env.TON_SOCIETY_API_KEY || "";
  const url = `${baseUrl}/activities/${activityId}/allowlist/telegram-ids`;

  let attempts = 0;
  while (attempts < 10) {
    try {
      const res = await axios.post(url, formData, {
        headers: {
          ...formData.getHeaders(),
          "x-api-key": apiKey,
          "x-partner-id": "onton", // or your partner ID
        },
      });

      // We expect { status: "success", data: { reward_link_url: "..."} }
      if (res.data?.status === "success" && res.data?.data?.reward_link_url) {
        return res.data.data.reward_link_url;
      } else {
        logger.error(`Unrecognized response from Ton Society allowlist  for activityId=${activityId} =>`, res.data);
        return null;
      }
    } catch (error) {
      const status = (error as AxiosError)?.response?.status;
      // If 429 or 500 => retry with 30s sleep
      if (status === 429 || status === 500) {
        attempts++;
        if (attempts >= 10) {
          logger.error(`Max retries reached for activityId=${activityId}. Last error =>`, error);
          return null;
        }
        logger.warn(`Retry #${attempts} after HTTP ${status} error for activityId=${activityId} sleeping 20s...`);
        await new Promise((resolve) => setTimeout(resolve, 20_000));
      } else {
        // Other status => no retry
        logger.error("Error posting CSV to Ton Society =>", error);
        return null;
      }
    }
  }

  return null; // if somehow we exit loop
}
