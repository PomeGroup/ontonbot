import { notificationReplySchema } from "@/zodSchema/SocketZodSchemas";

type ValidatedNotificationReply = {
  valid: true;
  notificationId: string | number;
  answer: "yes" | "no";
};

type InvalidNotificationReply = {
  valid: false;
  error: string;
};

type NotificationReplyValidationResult = ValidatedNotificationReply | InvalidNotificationReply;

export const validateNotificationReply = (data: unknown): NotificationReplyValidationResult => {
  try {
    const validatedData = notificationReplySchema.parse(data);
    return {
      valid: true,
      notificationId: validatedData.notificationId,
      answer: validatedData.answer,
    };
  } catch (error) {
    console.error("Validation error:", error);
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Unknown validation error",
    };
  }
};

