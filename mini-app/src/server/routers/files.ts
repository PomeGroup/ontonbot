import axios from "axios";
import sizeOf from "image-size";
import { z } from "zod";
import { adminOrganizerProtectedProcedure, router } from "../trpc";
import { validateMimeType } from "@/lib/validateMimeType";
import { scanFileWithClamAV } from "@/lib/scanFileWithClamAV";
import FormData from "form-data";
import { logger } from "@/server/utils/logger";

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
                throw new Error("Only square images are allowed");
              }

              // Limit the size of the file
              const MAX_BASE64_SIZE = 10 * 1024 * 1024; // 10 MB
              if (base64Data.length > MAX_BASE64_SIZE) {
                throw new Error("File is too large");
              }

              return true;
            },
            {
              message: "Invalid image data",
            }
          )
          .transform(async (data) => {
            // Check if the data string is defined and has the correct format
            if (!data || typeof data !== "string") {
              throw new Error("Invalid base64 data");
            }
            logger.log("Base64 Data: ", data.slice(0, 100)); // Logging only the first 100 characters for readability
            // Check if the base64 data contains the data URL scheme
            const mimeTypeMatch = data.match(/^data:(.*?);base64,/);
            if (!mimeTypeMatch || !mimeTypeMatch[1]) {
              throw new Error("Invalid base64 image data format");
            }

            // Extract the MIME type
            const mimeType = mimeTypeMatch[1];

            // Remove the base64 prefix and get the image data
            const base64Data = data.replace(/^data:image\/\w+;base64,/, "");

            // Validate the MIME type
            if (!validateMimeType(mimeType)) {
              throw new Error("Invalid file type");
            }

            // Convert base64 to Buffer for malware scanning
            const buffer = Buffer.from(base64Data, "base64");

            // Scan the file for malware using ClamAV
            const isClean = await scanFileWithClamAV(buffer);
            if (!isClean) {
              throw new Error("Malicious file detected");
            }

            // Return the buffer and MIME type
            return { buffer, mimeType };
          }),

        subfolder: z.enum(["event", "sbt"]), // Added subfolder to the schema
      })
    )
    .mutation(async (opts) => {
      // Set the bucket name from environment variable or default to 'onton'
      const bucketName = process.env.MINIO_IMAGE_BUCKET || "onton";

      // Choose subfolder based on eventType ('event' or 'sbt')
      const subfolder = opts.input.subfolder; // Use eventType to determine subfolder

      // Make sure the mimeType is extracted from the transformed data
      const { buffer, mimeType } = opts.input.image; // Correctly reference the returned mimeType and buffer

      // Create the full file path including the subfolder
      const fullFilename = `${subfolder}/event_image.${mimeType.split("/")[1]}`; // Ensure mimeType is split correctly

      // Create form data for the upload
      const formData = new FormData();
      formData.append("image", buffer, {
        filename: fullFilename,
        contentType: mimeType,
      });

      // Append the bucket name to the form data
      formData.append("bucketName", bucketName);
      // Send the image data to the upload service (MinIO)
      const url = `http://${process.env.IP_NFT_MANAGER!}:${process.env.NFT_MANAGER_PORT!}/files/upload`;
      logger.log("URL: ", url);
      try {
        const res = await axios.post(url, formData, {
          headers: formData.getHeaders(),
        });
        logger.log("Response: ", res.data);

        if (!res.data || !res.data.imageUrl) {
          throw new Error("File upload failed");
        }

        return res.data as { imageUrl: string };
      } catch (error) {
        logger.error("Error during file upload:", error);
        throw new Error("An error occurred during file upload");
      }
    }),
  uploadVideo: adminOrganizerProtectedProcedure
    .input(
      z.object({
        video: z
          .string()
          .refine(
            (file) => {
              // Remove base64 header and get the video data
              const base64Data = file.replace(/^data:video\/\w+;base64,/, "");

              // Limit the size of the file
              const MAX_BASE64_SIZE = Math.floor(5 * 1024 * 1024 * (4 / 3)) ; // 5 MB
              if (base64Data.length > MAX_BASE64_SIZE) {
                throw new Error("File is too large");
              }

              return true;
            },
            {
              message: "Invalid video data",
            }
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

            // Scan the file for malware
            const isClean = await scanFileWithClamAV(buffer);
            if (!isClean) {
              throw new Error("Malicious file detected");
            }

            return { buffer, mimeType };
          }),

        subfolder: z.enum(["event", "sbt"]),
      })
    )
    .mutation(async (opts) => {
      const bucketName = process.env.MINIO_VIDEO_BUCKET || "ontonvideo";
      const subfolder = opts.input.subfolder;
      try {
        const { buffer, mimeType } = opts.input.video;
        const fullFilename = `${subfolder}/event_video.${mimeType.split("/")[1]}`;

        const formData = new FormData();
        formData.append("video", buffer, {
          filename: fullFilename,
          contentType: mimeType,
        });

        formData.append("bucketName", bucketName);
        const url = `http://${process.env.IP_NFT_MANAGER!}:${process.env.NFT_MANAGER_PORT!}/files/upload-video`;
        logger.log("URL: ", url);
        logger.log("Form Data: ", formData.getHeaders());
        const res = await axios.post(url, formData, {
          headers: formData.getHeaders(),
        });

        if (!res.data || !res.data.videoUrl) {
          logger.error("File upload failed");
          throw new Error("File upload failed");
        }

        return res.data as { videoUrl: string };
      }
      catch (error) {
        logger.error("Error during file upload:", error);
        throw new Error("An error occurred during file upload");
      }

    }),
});
