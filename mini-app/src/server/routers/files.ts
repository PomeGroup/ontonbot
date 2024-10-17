import axios from "axios";
import sizeOf from "image-size";
import { z } from "zod";
import { adminOrganizerProtectedProcedure, router } from "../trpc";
import { validateMimeType } from "@/lib/validateMimeType";
import { scanFileWithClamAV } from "@/lib/scanFileWithClamAV";
import FormData from "form-data";

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
            console.log("Base64 Data: ", data.slice(0, 100)); // Logging only the first 100 characters for readability
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
      console.log("mutation state");
      // Set the bucket name from environment variable or default to 'onton'
      const bucketName = process.env.MINIO_IMAGE_BUCKET || "onton";

      // Choose subfolder based on eventType ('event' or 'sbt')
      const subfolder = opts.input.subfolder; // Use eventType to determine subfolder

      // Make sure the mimeType is extracted from the transformed data
      const { buffer, mimeType } = opts.input.image; // Correctly reference the returned mimeType and buffer

      // Create the full file path including the subfolder
      const fullFilename = `${subfolder}/event_image.${mimeType.split("/")[1]}`; // Ensure mimeType is split correctly
      console.log("fullFilename", fullFilename);
      
      // Create form data for the upload
      const formData = new FormData();
      formData.append("image", buffer, {
        filename: fullFilename,
        contentType: mimeType,
      });

      // Append the bucket name to the form data
      formData.append("bucketName", bucketName);
      console.log("---Bucket Name: ", bucketName); // Log the bucket name for debugging

      // Send the image data to the upload service (MinIO)
      const res = await axios.post(
        process.env.FILE_UPLOAD_URL || "http://127.0.0.1:7863/files/upload",
        formData,
        { headers: formData.getHeaders() }
      );

      // Handle response and ensure the upload was successful
      if (!res.data || !res.data.imageUrl) {
        throw new Error("File upload failed");
      }

      // Return the public URL of the uploaded image
      return res.data as { imageUrl: string };
    }),
});
