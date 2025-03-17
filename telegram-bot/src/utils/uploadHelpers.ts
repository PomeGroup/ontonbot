import fs from "fs";
import ffmpeg from "fluent-ffmpeg";
import sharp from "sharp";
import { minioClient } from "../lib/minioClient"; // adjust import path as needed
import { logger } from "../utils/logger";         // adjust import path as needed

// For ffmpeg to find ffprobe
const FFPROBE_PATH = "/usr/bin/ffprobe"; // or your path to ffprobe
ffmpeg.setFfprobePath(FFPROBE_PATH);

/**
 * Generate a unique prefix for file names.
 * You likely have a helper like `filePrefix`—recreate or import it here.
 */
function filePrefix() {
  return `${Date.now()}-`;
}

/** Check if a video is square using ffmpeg/ffprobe. */
async function isSquareVideo(filePath: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err || !metadata) {
        return reject(new Error("Failed to parse video metadata."));
      }
      // We assume the first stream has width/height
      const { width, height } = metadata.streams[0];
      resolve(width === height);
    });
  });
}

/** Check if an image is square using sharp. */
async function isSquareImage(buffer: Buffer): Promise<boolean> {
  const meta = await sharp(buffer).metadata();
  return meta.width === meta.height;
}

/**
 * Upload a video Buffer to MinIO after validating:
 *   - Must be MP4
 *   - <= 5 MB
 *   - Square dimension
 */
export async function uploadVideoToMinio(
  videoBuffer: Buffer,
  mimeType: string,
  originalFilename: string,
  subfolder: string = "event",
  bucketName: string = "ontonvideo",
): Promise<string> {
  // 1) Validate MIME
  if (mimeType !== "video/mp4") {
    throw new Error("Only MP4 format is allowed.");
  }

  // 2) Check size
  const sizeBytes = videoBuffer.byteLength;
  if (sizeBytes > 5 * 1024 * 1024) {
    throw new Error("Video size exceeds the 5 MB limit.");
  }

  // 3) For the square check, we need a temp file
  const tempFilePath = `/tmp/${Date.now()}_${originalFilename}`;
  fs.writeFileSync(tempFilePath, videoBuffer);

  try {
    const square = await isSquareVideo(tempFilePath);
    if (!square) {
      throw new Error("Only square videos are allowed.");
    }
  } finally {
    // Clean up
    fs.unlinkSync(tempFilePath);
  }

  // 4) Build final filename
  const finalFilename = subfolder
    ? `${subfolder}/${filePrefix()}${originalFilename}`
    : `${filePrefix()}${originalFilename}`;

  // 5) Upload to MinIO
  await minioClient.putObject(bucketName, finalFilename, videoBuffer, sizeBytes, {
    "Content-Type": mimeType,
  });

  // 6) Return public URL
  const publicUrl = process.env.MINIO_PUBLIC_URL;
  if (!publicUrl) {
    throw new Error("MINIO_PUBLIC_URL not configured in environment.");
  }
  return `${publicUrl}/${bucketName}/${finalFilename}`;
}

/**
 * Upload an image Buffer to MinIO after validating:
 *   - Is an image
 *   - (Optional) Must be square
 *   - Optionally resize or do other transformations
 */
export async function uploadImageToMinio(
  imageBuffer: Buffer,
  mimeType: string,
  originalFilename: string,
  subfolder: string = "",
  bucketName: string = "onton",
  mustBeSquare: boolean = true, // set to false if you only want to resize without square-check
): Promise<string> {
  // 1) Ensure it’s an image
  if (!mimeType.startsWith("image/")) {
    throw new Error("File is not an image.");
  }

  // 2) Check if image is square (if needed)
  if (mustBeSquare) {
    const square = await isSquareImage(imageBuffer);
    if (!square) {
      throw new Error("Only square images are allowed.");
    }
  }

  // 3) (Optional) Resize or transform with sharp
  //    If you always want to enforce a max dimension:
  const finalBuffer = await sharp(imageBuffer)
    .resize({
      width: 1280,
      height: 1280,
      fit: "inside",
      withoutEnlargement: true,
    })
    .toBuffer();

  // 4) Build final filename
  const finalFilename = subfolder
    ? `${subfolder}/${filePrefix()}${originalFilename}`
    : `${filePrefix()}${originalFilename}`;

  // 5) Upload to MinIO
  await minioClient.putObject(bucketName, finalFilename, finalBuffer, finalBuffer.byteLength, {
    "Content-Type": mimeType,
  });

  // 6) Return public URL
  const publicUrl = process.env.MINIO_PUBLIC_URL;
  if (!publicUrl) {
    throw new Error("MINIO_PUBLIC_URL not configured in environment.");
  }
  return `${publicUrl}/${bucketName}/${finalFilename}`;
}
