import { z } from "zod";

const urlSchema = z
  .string()
  .min(1, "URL is required")
  .url("Invalid URL format")
  .regex(/^https?:\/\//, "URL must start with http:// or https://")
  .regex(/^[^\s]+$/, "URL cannot contain spaces")
  .regex(
    /^(https?:\/\/)([a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\/[^\s]*)?$/,
    "Invalid URL structure"
  )
  .refine((url) => {
    try {
      const parsedUrl = new URL(url);
      // Check for valid protocol
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        return false;
      }
      // Check domain has at least one dot and valid TLD
      const domainParts = parsedUrl.hostname.split(".");
      if (domainParts.length < 2) {
        return false;
      }
      // Ensure each domain part is valid
      return domainParts.every(
        (part) =>
          part.length > 0 &&
          /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(part)
      );
    } catch {
      return false;
    }
  }, "Invalid URL format")
  .transform((url) => url.trim());

export const dataValidationSchema = {
  urlSchema,
};
