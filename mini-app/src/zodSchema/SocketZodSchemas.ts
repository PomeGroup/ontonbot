// Zod schema for input validation and sanitization
import { z } from "zod";
export const testEventSchema = z.object({
  message: z
    .string()
    .min(1, "Message cannot be empty")
    .max(200, "Message cannot exceed 200 characters")
    .transform((value) => value.replace(/</g, "&lt;").replace(/>/g, "&gt;")), // Basic sanitization
});

export const notificationReplyPOASimpleSchema = z.object({
  notificationId: z.union([z.number(), z.string()]),
  answer: z.enum(["yes", "no"]),
  type: z.literal("POA_SIMPLE"),
});

export const notificationReplyPasswordSchema = z.object({
  notificationId: z.union([z.number(), z.string()]),
  answer: z.string().min(1, "Password cannot be empty"),
  type: z.literal("POA_PASSWORD"),
});