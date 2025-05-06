import { NextRequest, NextResponse } from "next/server";
import formidable, { Fields, Files, File as FormidableFile } from "formidable";
import fs from "fs";
import { verify } from "jsonwebtoken";
import { toNodeJsRequest } from "../helpers/toNodeJsRequest";
import { minioClient } from "@/lib/minioClient";
import { filePrefix } from "@/lib/fileUtils";
import { logger } from "@/server/utils/logger";
import sharp from "sharp";

const { MINIO_PUBLIC_URL, ONTON_API_SECRET } = process.env;

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Helper to parse incoming form data using formidable. */
async function parseFormdata(req: NextRequest): Promise<{ fields: Fields; files: Files }> {
  const nodeReq = await toNodeJsRequest(req);
  const form = formidable({ multiples: false });

  return new Promise((resolve, reject) => {
    form.parse(nodeReq, (err, fields, files) => {
      if (err) {
        logger.log(`Error parsing formData: ${err}`);
        return reject(err);
      }
      resolve({ fields, files });
    });
  });
}

export async function POST(req: NextRequest) {
  // 1. Check token
  const authHeader = req.headers.get("authorization") ?? "";
  const [bearer, token] = authHeader.split(" ");
  if (bearer !== "Bearer" || !token) {
    return NextResponse.json({ message: "Unauthorized: missing token" }, { status: 401 });
  }
  if (!ONTON_API_SECRET) {
    return NextResponse.json({ message: "Server misconfiguration" }, { status: 500 });
  }
  try {
    verify(token, ONTON_API_SECRET);
  } catch (error) {
    logger.error(`Invalid token: ${error}`);
    return NextResponse.json({ message: "Unauthorized: invalid token" }, { status: 401 });
  }

  // 2. Parse form data
  let files: Files;
  let fields: Fields;
  try {
    ({ files, fields } = await parseFormdata(req));
  } catch (err) {
    return NextResponse.json({ message: "Error parsing form data" }, { status: 400 });
  }

  // 3. Prepare MinIO paths
  const rawBucket = fields.bucketName ?? "onton";
  const rawSubfolder = fields.subfolder ?? "";
  const bucketName = Array.isArray(rawBucket) ? rawBucket[0] : rawBucket;
  const subfolder = Array.isArray(rawSubfolder) ? rawSubfolder[0] : rawSubfolder;

  const imageField = files.image;
  if (!imageField) {
    return NextResponse.json({ message: "No file uploaded." }, { status: 400 });
  }

  const file = Array.isArray(imageField) ? imageField[0] : imageField;
  const formidableFile = file as FormidableFile;

  try {
    // 4. Read file data as a Node buffer
    const fileData = fs.readFileSync(formidableFile.filepath);

    // 5. If it’s recognized as an image, resize with Sharp
    let finalBuffer = fileData; // If not an image or fails to resize, fall back
    if (formidableFile.mimetype?.startsWith("image/")) {
      finalBuffer = await sharp(Buffer.from(fileData)) // Force Node Buffer
        .resize({
          width: 1280,
          height: 1280,
          fit: "inside",
          withoutEnlargement: true,
        })
        .toBuffer();
    }

    // 6. Upload to MinIO
    const finalFilename = subfolder
      ? `${subfolder}/${filePrefix()}${formidableFile.originalFilename}`
      : `${filePrefix()}${formidableFile.originalFilename}`;

    await minioClient.putObject(bucketName, finalFilename, finalBuffer, finalBuffer.byteLength, {
      "Content-Type": formidableFile.mimetype ?? "application/octet-stream",
    });

    const imageUrl = `${MINIO_PUBLIC_URL}/${bucketName}/${finalFilename}`;
    return NextResponse.json({ imageUrl });
  } catch (error) {
    logger.error(`An error occurred while uploading: ${error}`);
    return NextResponse.json({ message: "An error occurred." }, { status: 500 });
  }
}
