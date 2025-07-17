import formidable, { Fields, Files, File as FormidableFile } from "formidable";
import fs from "fs";
import { NextRequest, NextResponse } from "next/server";
// import path from "path";
import ffmpeg from "fluent-ffmpeg";
// import ffprobeStatic from "ffprobe-static";
import { checkRateLimit } from "@/lib/checkRateLimit";
import { filePrefix } from "@/lib/fileUtils";
import { minioClient } from "@/lib/minioClient";
import { scanFileWithClamAV } from "@/lib/scanFileWithClamAV";
import { validateTelegramInitData } from "@/lib/validateTelegramInitData";
import { toNodeJsRequest } from "../helpers/toNodeJsRequest";

/**
 * Important for Next.js App Router:
 * - Use Node.js runtime (not edge).
 * - Force dynamic if needed.
 */

// 2. If you need Node.js runtime and forced dynamic:
export const runtime = "nodejs";

const FFPROBE_PATH = "/usr/bin/ffprobe"; // Path to your system's ffprobe (Ubuntu default).
// Alternatively: ffmpeg.setFfprobePath(ffprobeStatic.path) if you use ffprobe-static
/**
 * Parse multipart form data using formidable.
 */
async function parseFormdata(req: NextRequest): Promise<{ fields: Fields; files: Files }> {
  const nodeReq = await toNodeJsRequest(req);
  const form = formidable({ multiples: false });
  return new Promise((resolve, reject) => {
    form.parse(nodeReq, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });
}

/**
 * Check if the video is square using ffprobe via fluent-ffmpeg.
 */
async function checkIfSquareVideo(filePath: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    ffmpeg.setFfprobePath(FFPROBE_PATH);
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (process.env.NODE_ENV === "development") {
        resolve(true);
        return;
      }

      if (err || !metadata) {
        return reject(new Error("Failed to parse video metadata."));
      }
      const { width, height } = metadata.streams[0];
      resolve(width === height);
    });
  });
}

export async function POST(req: NextRequest) {
  if (process.env.MINIO_PUBLIC_URL === undefined) {
    return NextResponse.json({ message: "Missing MINIO URL variable." }, { status: 500 });
  }
  try {
    // 1. Rate-limit  & validate user

    const initData = req.headers.get("x-init-data");
    if (!initData) {
      return NextResponse.json({ message: "Unauthorized access." }, { status: 401 });
    }
    const userValidation = validateTelegramInitData(initData);
    if (!userValidation.valid) {
      return NextResponse.json({ message: "Unauthorized access." }, { status: 401 });
    }
    const initDataJson = userValidation.initDataJson;

    const { allowed } = await checkRateLimit(initDataJson.user.id, "uploadVideo", 5, 60);
    if (!allowed) {
      return NextResponse.json({ message: "Rate limit exceeded. Please wait a minute." }, { status: 429 });
    }

    // 2. Parse the form data
    const { fields, files } = await parseFormdata(req);
    const rawSubfolder = fields.subfolder ?? "event";
    const rawBucket = fields.bucketName ?? "ontonvideo";
    const subfolder = Array.isArray(rawSubfolder) ? rawSubfolder[0] : rawSubfolder;
    const bucketName = Array.isArray(rawBucket) ? rawBucket[0] : rawBucket;

    // 3. Check for the 'video' field
    const rawVideo = files.video;
    if (!rawVideo) {
      return NextResponse.json({ message: "No video file uploaded." }, { status: 400 });
    }
    const formFile = Array.isArray(rawVideo) ? rawVideo[0] : (rawVideo[0] ?? rawVideo);
    if (!formFile) {
      return NextResponse.json({ message: "No video file uploaded." }, { status: 400 });
    }

    const file = formFile as FormidableFile;

    // 4. Validate file type & size
    if (file.mimetype !== "video/mp4") {
      return NextResponse.json({ message: "Only MP4 format is allowed." }, { status: 400 });
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ message: "Video size exceeds the 5 MB limit." }, { status: 400 });
    }

    // 5. Check if square
    const isSquare = await checkIfSquareVideo(file.filepath);
    if (!isSquare) {
      return NextResponse.json({ message: "Only square videos are allowed." }, { status: 400 });
    }

    // 6. Scan the raw file for malware
    const originalBuffer = fs.readFileSync(file.filepath);
    const isClean = await scanFileWithClamAV(originalBuffer);
    if (!isClean) {
      return NextResponse.json({ message: "Malicious file detected." }, { status: 400 });
    }

    // ---------------------------------------------------------
    // 7. Watermark logic (COMMENTED OUT):
    //
    //    If you want to apply a watermark, uncomment this block
    //    and comment out the direct upload below.
    // ---------------------------------------------------------
    /*
    const tmpFolder = "/tmp"; // or another temp directory
    const watermarkedFilename = `wm-${filePrefix()}-${file.originalFilename}`;
    const watermarkedPath = path.join(tmpFolder, watermarkedFilename);

    // Use fluent-ffmpeg to add text overlay at top-right
    await new Promise<void>((resolve, reject) => {
      ffmpeg(file.filepath)
        .setFfprobePath(FFPROBE_PATH)
        .videoCodec("libx264")
        .outputOptions([
          "-vf",
          "drawtext=" +
          "fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:" +
          "text='published by onton':" +
          "x=(w-text_w-20):y=20:" + // top-right
          "fontcolor=white:fontsize=32:" +
          "box=1:boxcolor=black@0.5:boxborderw=6",
          "-c:a",
          "copy",
        ])
        .on("start", (cmd) => console.log("FFmpeg start:", cmd))
        // .on("stderr", (line) => console.log("FFmpeg stderr:", line))
        .on("error", (err) => reject(err))
        .on("end", () => resolve())
        .save(watermarkedPath);
    });

    const watermarkedBuffer = fs.readFileSync(watermarkedPath);
    const watermarkedSize = fs.statSync(watermarkedPath).size;
    */

    // 8. Build final filename for Minio
    const originalName = file.originalFilename || `video-${Date.now()}.mp4`;
    const finalFilename = subfolder ? `${subfolder}/${filePrefix()}${originalName}` : `${filePrefix()}${originalName}`;

    // ---------------------------------------------------------
    // 9. Direct Upload (NO WATERMARK)
    //    If you want the watermark, upload watermarkedBuffer instead.
    // ---------------------------------------------------------
    await minioClient.putObject(bucketName, finalFilename, originalBuffer, file.size, {
      "Content-Type": "video/mp4",
    });

    // 10. Return public URL
    const videoUrl = `${process.env.MINIO_PUBLIC_URL}/${bucketName}/${finalFilename}`;
    return NextResponse.json({ videoUrl }, { status: 200 });
  } catch (error) {
    console.error("Error uploading video:", error);
    return NextResponse.json({ message: "An error occurred during video upload." }, { status: 500 });
  }
}
