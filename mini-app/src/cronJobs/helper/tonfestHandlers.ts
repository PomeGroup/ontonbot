import { sendHttpRequest } from "@/lib/httpHelpers";
import { configProtected } from "@/server/config";
import { logger } from "@/server/utils/logger";

/*
to insert configs into the database, run the following SQL commands:
INSERT INTO "public"."onton_setting" ("env", "var", "value", "protected") VALUES ('development', 'TONFEST_API', '["https://api-public-test.ton-fest.com/"," api key "]', 't');
INSERT INTO "public"."onton_setting" ("env", "var", "value", "protected") VALUES ('staging', 'TONFEST_API', '["https://api-public-test.ton-fest.com/"," api key "]', 't');
INSERT INTO "public"."onton_setting" ("env", "var", "value", "protected") VALUES ('local', 'TONFEST_API', '["https://api-public-test.ton-fest.com/"," api key ]', 't');
INSERT INTO "public"."onton_setting" ("env", "var", "value", "protected") VALUES ('production', 'TONFEST_API', '["https://api.ton-fest.com/"," api key ]', 't');
 */

export const addUserTicketFromOnton = async (payload: any): Promise<{ success: boolean; data: any }> => {
  const BaseUrl = configProtected?.TONFEST_API?.[0] || "";
  const Authorization = configProtected?.TONFEST_API?.[1] || "";
  const endpoint = BaseUrl + "external-partners/onton/addUserTicketFromOnton";
  logger.log(`Calling TonFest endpoint: ${endpoint}`);
  // Construct headers, method, etc. right here
  const headers = {
    "Content-Type": "application/json",
  };

  try {
    const finalPayload = {
      ...payload,
      authorization: Authorization,
    };
    const { success, data } = await sendHttpRequest("POST", endpoint, headers, finalPayload);
    if (!data.success) {
      console.error("Failed to add user ticket from Onton:", data);
      return { success: false, data: { error: data.error } };
    }
    return { success, data };
  } catch (err: any) {
    return { success: false, data: { error: err.message } };
  }
};

// If you have more TonFest endpoints, define them similarly...
