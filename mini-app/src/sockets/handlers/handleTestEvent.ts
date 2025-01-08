// Handle specific "test-event"
import { testEventSchema } from "@/zodSchema/SocketZodSchemas";
import { z } from "zod";
import { logger } from "@/server/utils/logger";
export const handleTestEvent = (data: any, callback: Function, sanitizedUsername: string) => {
  try {
    // Validate and sanitize input using Zod
    const validatedData = testEventSchema.parse(data);

    logger.log(`Received test-event from ${sanitizedUsername}: ${validatedData.message}`);

    // Send success response
    if (callback) {
      callback({ status: "success", message: "Test event processed successfully" });
    }
  } catch (error) {
    logger.error("Error processing test-event:", error);

    // Handle validation errors
    if (callback) {
      callback({
        status: "error",
        message: error instanceof z.ZodError ? error.errors[0].message : "Invalid input",
      });
    }
  }
};
