// Handle specific "test-event"
import { testEventSchema } from "@/zodSchema/SocketZodSchemas";
import { z } from "zod";

export const handleTestEvent = (data: any, callback: Function, sanitizedUsername: string) => {
  try {
    // Validate and sanitize input using Zod
    const validatedData = testEventSchema.parse(data);

    console.log(`Received test-event from ${sanitizedUsername}: ${validatedData.message}`);

    // Send success response
    if (callback) {
      callback({ status: "success", message: "Test event processed successfully" });
    }
  } catch (error) {
    console.error("Error processing test-event:", error);

    // Handle validation errors
    if (callback) {
      callback({
        status: "error",
        message: error instanceof z.ZodError ? error.errors[0].message : "Invalid input",
      });
    }
  }
};
