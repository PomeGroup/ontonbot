import {notificationReplyPOASimpleSchema ,notificationReplyPasswordSchema} from "@/zodSchema/SocketZodSchemas";
import {ZodError} from "zod";
import { logger } from "@/server/utils/logger";

type ValidatedNotificationReply = {
  valid: true;
  notificationId: string | number;
  answer: "yes" | "no" | string;
  type: "POA_SIMPLE" | "POA_PASSWORD";
};

type InvalidNotificationReply = {
  valid: false;
  error: string;
};

type NotificationReplyValidationResult = ValidatedNotificationReply | InvalidNotificationReply;

export const validateNotificationReply = (data: any): NotificationReplyValidationResult => {
  try {
    logger.log("Validating notification reply data:", data);
    if(typeof data !== "object" || data === null || !data?.type) {
        return {
            valid: false,
            error: "Invalid data object",
        };
    }
    const schemaToUse = data.type === "POA_SIMPLE" ? notificationReplyPOASimpleSchema : notificationReplyPasswordSchema;
    const validatedData = schemaToUse.parse(data);
    return {
      valid: true,
      notificationId: validatedData.notificationId,
      answer: validatedData.answer,
      type: validatedData.type,
    };
  } catch (error: unknown) {
    let errorMsg = "Unknown validation error";
    if (error instanceof ZodError) {
      // Extract just the error messages
      errorMsg = error.issues.map((issue) => issue.message).join(", ");
    }
    logger.error("Validation error:", errorMsg);
    return {
      valid: false,
      error: errorMsg,
    };
  }
};

