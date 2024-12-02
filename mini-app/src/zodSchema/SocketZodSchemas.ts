// Zod schema for input validation and sanitization
import { z } from "zod";
export const testEventSchema = z.object({
  message: z
    .string()
    .min(1, "Message cannot be empty")
    .max(200, "Message cannot exceed 200 characters")
    .transform((value) => value.replace(/</g, "&lt;").replace(/>/g, "&gt;")), // Basic sanitization
});