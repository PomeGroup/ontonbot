import { z } from "zod";
import { checkRateLimit } from "@/lib/checkRateLimit";
import { scanFileWithClamAV } from "@/lib/scanFileWithClamAV";


export function createVideoSchema(userId: string) {
  return z
    .object({
      video: z
        .string()
        .refine(
          (file) => {
            const base64Data = file.replace(/^data:video\/\w+;base64,/, "");
            if (base64Data.length > 5 * 1024 * 1024) {
              throw new Error("File is too large");
            }
            return true;
          },
          { message: "Invalid video data" }
        )
        .transform(async (data) => {
          if (!data || typeof data !== "string") {
            throw new Error("Invalid base64 data");
          }

          const mimeTypeMatch = data.match(/^data:(.*?);base64,/);
          if (!mimeTypeMatch || mimeTypeMatch[1] !== "video/mp4") {
            throw new Error("Only MP4 format is allowed");
          }

          const mimeType = mimeTypeMatch[1];
          const base64Data = data.replace(/^data:video\/\w+;base64,/, "");
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
      const { allowed, remaining } = await checkRateLimit(userId, "uploadVideo", 10, 60);
      if (!allowed) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Rate limit exceeded. Please wait a minute.",
        });
      } else {
        (val as any)._remainingRateLimit = remaining;
      }
    });
}
