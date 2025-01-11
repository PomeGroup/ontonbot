import { z } from "zod";
import sizeOf from "image-size";
import { checkRateLimit } from "@/lib/checkRateLimit";
import { validateMimeType } from "@/lib/validateMimeType";
import { scanFileWithClamAV } from "@/lib/scanFileWithClamAV";
import { logger } from "@/server/utils/logger";

export function createImageSchema(userId: string) {
  return z
    .object({
      image: z
        .string()
        .refine(
          (file) => {
            // Basic check: remove base64 header, measure image
            const base64Data = file.replace(/^data:image\/\w+;base64,/, "");
            const image = sizeOf(Buffer.from(base64Data, "base64"));

            if (image.width !== image.height) {
              throw new Error("Only square images are allowed");
            }

            if (base64Data.length > 10 * 1024 * 1024) {
              throw new Error("File is too large");
            }

            return true;
          },
          { message: "Invalid image data" }
        )
        .transform(async (data) => {
          // Additional checks (mime type, malware, etc.)
          if (!data || typeof data !== "string") {
            throw new Error("Invalid base64 data");
          }
          logger.log("Base64 (first 100 chars): ", data.slice(0, 100));

          const mimeTypeMatch = data.match(/^data:(.*?);base64,/);
          if (!mimeTypeMatch || !mimeTypeMatch[1]) {
            throw new Error("Invalid base64 image data format");
          }

          const mimeType = mimeTypeMatch[1];
          const base64Data = data.replace(/^data:image\/\w+;base64,/, "");

          if (!validateMimeType(mimeType)) {
            throw new Error("Invalid file type");
          }

          // Convert base64 -> Buffer -> scan for malware
          const buffer = Buffer.from(base64Data, "base64");
          const isClean = await scanFileWithClamAV(buffer);
          if (!isClean) {
            throw new Error("Malicious file detected");
          }

          return { buffer, mimeType };
        }),
      subfolder: z.enum(["event", "sbt"]),
    })
    .superRefine(async (val, ctx) => {
      // *** Async rate limit check ***
      const { allowed, remaining } = await checkRateLimit(userId, "uploadImage", 10, 60);
      if (!allowed) {
        // Attach a Zod issue, so the entire validation fails
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Rate limit exceeded. Please wait a minute.",
        });
      } else {
        // If it's allowed, we can store `remaining` in a "hidden" property
        // so we can retrieve it later after parse.
        // (Zod won't pass it forward by default, but we can store it on `val`).
        (val as any)._remainingRateLimit = remaining;
      }
    });
}
