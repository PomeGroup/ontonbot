import { NextRequest, NextResponse } from 'next/server';
import formidable, { Fields, Files, File as FormidableFile } from 'formidable';
import fs from 'fs';
import { verify } from 'jsonwebtoken';
import { toNodeJsRequest } from '../helpers/toNodeJsRequest';
import { minioClient } from '@/lib/minioClient';
import { filePrefix } from '@/lib/fileUtils';

export const dynamic = 'force-dynamic'; // Ensures Next.js does not statically optimize this route

// Example: Use your environment variable name, e.g. ONTON_API_SECRET
const JWT_SECRET = process.env.ONTON_API_SECRET || 'fallback-secret';

/**
 * Reads the entire NextRequest into memory, converts it to a Node.js-like
 * IncomingMessage, and parses it with formidable.
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
 * Mirrors the NestJS `@Post('upload-video')`
 * - Only MP4
 * - Max 5MB
 * - JWT-protected
 */
export async function POST(req: NextRequest) {
  // 1. Extract & verify JWT
  const authHeader = req.headers.get('authorization') ?? '';
  const [bearer, token] = authHeader.split(' ');

  if (bearer !== 'Bearer' || !token) {
    return NextResponse.json({ message: 'Unauthorized: missing token' }, { status: 401 });
  }

  try {
    verify(token, JWT_SECRET);
    // If verify throws, we catch below. If it's successful, continue.
  } catch (error) {
    console.error('Invalid JWT:', error);
    return NextResponse.json({ message: 'Unauthorized: invalid token' }, { status: 401 });
  }

  // 2. If token is valid, proceed with form parse & upload
  try {
    // Parse the form data
    const { fields, files } = await parseFormdata(req);

    // Extract subfolder/bucket (with defaults)
    const rawSubfolder = fields.subfolder ?? 'event';
    const rawBucket = fields.bucketName ?? 'ontonvideo';
    const subfolder = Array.isArray(rawSubfolder) ? rawSubfolder[0] : rawSubfolder;
    const bucketName = Array.isArray(rawBucket) ? rawBucket[0] : rawBucket;

    // Check for the 'video' field
    const rawVideo = files.video;
    if (!rawVideo) {
      return NextResponse.json({ message: 'No video file uploaded.' }, { status: 400 });
    }

    // If it's an array, pick the first
    const file = Array.isArray(rawVideo) ? rawVideo[0] : rawVideo;
    if (!file) {
      return NextResponse.json({ message: 'No video file uploaded.' }, { status: 400 });
    }

    // Cast to FormidableFile
    const formFile = file as FormidableFile;

    // Validate the file type
    if (formFile.mimetype !== 'video/mp4') {
      return NextResponse.json({ message: 'Only MP4 format is allowed.' }, { status: 400 });
    }

    // Validate file size (max 5 MB)
    if (formFile.size > 5 * 1024 * 1024) {
      return NextResponse.json({ message: 'Video size exceeds the 5 MB limit.' }, { status: 400 });
    }

    // Read the file into a Buffer
    const fileData = fs.readFileSync(formFile.filepath);

    // Build final filename
    const finalFilename = subfolder
      ? `${subfolder}/${filePrefix()}${formFile.originalFilename}`
      : `${filePrefix()}${formFile.originalFilename}`;

    // Upload to MinIO
    await minioClient.putObject(bucketName, finalFilename, fileData, formFile.size, {
      'Content-Type': 'video/mp4',
    });

    // Return public URL
    const videoUrl = `${process.env.MINIO_PUBLIC_URL}/${bucketName}/${finalFilename}`;
    return NextResponse.json({ videoUrl }, { status: 200 });
  } catch (error) {
    console.error('Error uploading video:', error);
    return NextResponse.json(
      { message: 'An error occurred during video upload.' },
      { status: 500 }
    );
  }
}
