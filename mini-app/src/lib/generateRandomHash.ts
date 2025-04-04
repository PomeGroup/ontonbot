import { randomBytes } from "crypto";

/**
 * Helper: generate random link hash
 */
export const generateRandomHash = (length = 8) => {
  return randomBytes(length).toString("hex"); // e.g. "af14bc..."
};