import axios from "axios";
import sizeOf from "image-size";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { adminOrganizerProtectedProcedure, router } from "../trpc";
import { validateMimeType } from "@/lib/validateMimeType";
import { scanFileWithClamAV } from "@/lib/scanFileWithClamAV";
import FormData from "form-data";
import { logger } from "@/server/utils/logger";
import jwt from "jsonwebtoken";
import { checkRateLimit } from "@/lib/checkRateLimit";
import { UPLOAD_IMAGE_RATE_LIMIT, UPLOAD_VIDEO_RATE_LIMIT } from "@/constants";
// Base URL for Next.js API routes
const API_BASE_URL = (process.env.NEXT_PUBLIC_APP_BASE_URL || "http://localhost:3000") + "/api/";

// JWT secret from env
const JWT_SECRET = process.env.ONTON_API_SECRET ?? "fallback-secret";

export const fieldsRouter = router({
  uploadImage: adminOrganizerProtectedProcedure
    .input(
      z.object({
        image: z
          .string()
          .refine(
            (file) => {
              // Remove base64 header and get the image size
              const base64Data = file.replace(/^data:image\/\w+;base64,/, "");
              const image = sizeOf(Buffer.from(base64Data, "base64"));

              // Check if the image is square
              if (image.width !== image.height) {
                throw new TRPCError({
                  code: "BAD_REQUEST",
                  message: "Only square images are allowed",
                });
              }

              // Limit the size of the file (10 MB)
              const MAX_BASE64_SIZE = 10 * 1024 * 1024;
              if (base64Data.length > MAX_BASE64_SIZE) {
                throw new TRPCError({
                  code: "BAD_REQUEST",
                  message: "File is too large",
                });
              }

              return true;
            },
            { message: "Invalid image data" }
          )
          .transform(async (data) => {
            if (!data) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Invalid base64 data",
              });
            }


            const mimeTypeMatch = data.match(/^data:(.*?);base64,/);
            if (!mimeTypeMatch || !mimeTypeMatch[1]) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Invalid base64 image data format",
              });
            }

            const mimeType = mimeTypeMatch[1];
            const base64Data = data.replace(/^data:image\/\w+;base64,/, "");

            if (!validateMimeType(mimeType)) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Invalid file type",
              });
            }

            // Convert base64 -> Buffer -> scan for malware
            const buffer = Buffer.from(base64Data, "base64");
            const isClean = await scanFileWithClamAV(buffer);
            if (!isClean) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Malicious file detected",
              });
            }

            return { buffer, mimeType };
          }),
        subfolder: z.enum(["event", "sbt", "channels"]),
      })
    )
    .mutation(async (opts) => {
      // 1. Rate-limit check
      const userId = opts.ctx.user.user_id;
      const { allowed, remaining } = await checkRateLimit(String(userId), "uploadImage", UPLOAD_IMAGE_RATE_LIMIT.max, UPLOAD_IMAGE_RATE_LIMIT.window);
      if (!allowed) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Rate limit exceeded. Please wait a minute.",
        });
      }

      // 2. Build the endpoint + form data
      const uploadEndpoint = `${API_BASE_URL}/files/upload`;
      const { buffer, mimeType } = opts.input.image;
      const subfolder = opts.input.subfolder;
      const extension = mimeType.split("/")[1] || "png";
      const fullFilename = `event_image.${extension}`;

      const formData = new FormData();
      formData.append("image", buffer, {
        filename: fullFilename,
        contentType: mimeType,
      });
      formData.append("subfolder", subfolder);

      // 3. Generate JWT
      const token = jwt.sign({ scope: "uploadImage" }, JWT_SECRET, { expiresIn: "1h" });

      // 4. Make the request
      try {
        const res = await axios.post(uploadEndpoint, formData, {
          headers: {
            ...formData.getHeaders(),
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.data || !res.data.imageUrl) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "File upload failed (no imageUrl in response)",
          });
        }

        // 5. Return result + remaining limit
        return { imageUrl: res.data.imageUrl, remainingRateLimit: remaining };
      } catch (error) {
        logger.error("Error during image upload:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "An error occurred during image upload",
          cause: error,
        });
      }
    }),

  uploadVideo: adminOrganizerProtectedProcedure
    .input(
      z.object({
        video: z
          .string()
          .refine(
            (file) => {
              // Remove base64 prefix
              const base64Data = file.replace(/^data:video\/\w+;base64,/, "");

              // Limit the size of the file
              const MAX_BASE64_SIZE = Math.floor(5 * 1024 * 1024 * (4 / 3)) ; // 5 MB
              if (base64Data.length > MAX_BASE64_SIZE) {
                throw new TRPCError({
                  code: "BAD_REQUEST",
                  message: "File is too large",
                });
              }
              return true;
            },
            { message: "Invalid video data" }
          )
          .transform(async (data) => {
            if (!data || typeof data !== "string") {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Invalid base64 data",
              });
            }

            const mimeTypeMatch = data.match(/^data:(.*?);base64,/);
            if (!mimeTypeMatch || mimeTypeMatch[1] !== "video/mp4") {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Only MP4 format is allowed",
              });
            }

            const mimeType = mimeTypeMatch[1];
            const base64Data = data.replace(/^data:video\/\w+;base64,/, "");
            const buffer = Buffer.from(base64Data, "base64");

            // Scan for malware
            const isClean = await scanFileWithClamAV(buffer);
            if (!isClean) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Malicious file detected",
              });
            }
            return { buffer, mimeType };
          }),
        subfolder: z.enum(["event", "sbt"]),
      })
    )
    .mutation(async (opts) => {
      // 1. Rate-limit check
      const userId = opts.ctx.user.user_id;
      const { allowed, remaining } = await checkRateLimit(String(userId), "uploadVideo", UPLOAD_VIDEO_RATE_LIMIT.max, UPLOAD_VIDEO_RATE_LIMIT.window);
      if (!allowed) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Rate limit exceeded. Please wait a minute.",
        });
      }

      // 2. Build the endpoint + form data
      const uploadVideoEndpoint = `${API_BASE_URL}/files/upload-video`;
      const { buffer, mimeType } = opts.input.video;
      const subfolder = opts.input.subfolder;
      const extension = mimeType.split("/")[1] || "mp4";
      const fullFilename = `event_video.${extension}`;

      const formData = new FormData();
      formData.append("video", buffer, {
        filename: fullFilename,
        contentType: mimeType,
      });
      formData.append("subfolder", subfolder);

      logger.log("Uploading video to: ", uploadVideoEndpoint);

      // 3. Generate JWT
      const token = jwt.sign({ scope: "uploadVideo" }, JWT_SECRET, { expiresIn: "1h" });

      // 4. Make the request
      try {
        const res = await axios.post(uploadVideoEndpoint, formData, {
          headers: {
            ...formData.getHeaders(),
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.data || !res.data.videoUrl) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "File upload failed (no videoUrl in response)",
          });
        }

        // 5. Return result + remaining limit
        return { videoUrl: res.data.videoUrl, remainingRateLimit: remaining };
      } catch (error) {
        logger.error("Error during video upload:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "An error occurred during video upload",
          cause: error,
        });
      }
    }),
});