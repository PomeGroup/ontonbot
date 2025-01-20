import { TRPCError } from "@trpc/server";
import crypto from "crypto";
export const throwTRPCError = (code: TRPCError["code"], message: unknown): never => {
  // Handle different types of `message` and ensure it's a string
  let errorMessage: string;

  if (message instanceof Error) {
    errorMessage = message.message; // Extract message from Error object
  } else if (typeof message === "string") {
    errorMessage = message; // Use it directly if it's already a string
  } else {
    errorMessage = JSON.stringify(message); // Convert non-string types to a JSON string
  }

  const error = { code, message: errorMessage };
  console.error(`Error in throwTRPCError:`, error);
  throw new TRPCError(error);
};

/**
 * Generates a random string code for coupon_item (the discount code).
 * You can adjust length/format as needed.
 */
export const generateRandomCode = (length = 8): string => {
  // For example, 8 bytes => 16 hex characters
  return crypto.randomBytes(length).toString("hex");
};
