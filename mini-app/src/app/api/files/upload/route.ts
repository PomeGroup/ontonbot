import { NextRequest, NextResponse } from 'next/server';
import formidable, { Fields, Files, File as FormidableFile } from 'formidable';
import fs from 'fs';
import { verify } from 'jsonwebtoken';
import { toNodeJsRequest } from '../helpers/toNodeJsRequest'; // Your helper
import { minioClient } from '@/lib/minioClient';
import { filePrefix } from '@/lib/fileUtils';
import { logger } from '@/server/utils/logger';

const { MINIO_PUBLIC_URL, ONTON_API_SECRET } = process.env;

export const dynamic = 'force-dynamic'; // Prevent static optimization

/**
 * Convert NextRequest to Node.js IncomingMessage and parse
 * with formidable for file uploads.
 */
async function parseFormdata(req: NextRequest): Promise<{ fields: Fields; files: Files }> {
  if (!MINIO_PUBLIC_URL) {
    logger.log(`MINIO_PUBLIC_URL is not defined in route /api/files/upload`);
    throw new Error('MINIO_PUBLIC_URL is not defined');
  }

  // 1. Convert NextRequest to a Node.js IncomingMessage
  const nodeReq = await toNodeJsRequest(req);

  // 2. Create formidable instance
  const form = formidable({ multiples: false });

  // 3. Parse
  return new Promise((resolve, reject) => {
    form.parse(nodeReq, (err, fields, files) => {
      if (err) {
        logger.log(`Error parsing formData in route /api/files/upload: ${err}`);
        return reject(err);
      }
      resolve({ fields, files });
    });
  });
}

export async function POST(req: NextRequest) {
  // 1. Extract token from "Authorization: Bearer <token>"
  const authHeader = req.headers.get('authorization') ?? '';
  const [bearer, token] = authHeader.split(' ');

  if (bearer !== 'Bearer' || !token) {
    logger.error(`Unauthorized request: missing token in /api/files/upload`);
    return NextResponse.json({ message: 'Unauthorized: missing token' }, { status: 401 });
  }

  // 2. Verify token with ONTON_API_SECRET
  if (!ONTON_API_SECRET) {
    logger.error(`ONTON_API_SECRET is not defined in environment`);
    return NextResponse.json({ message: 'Server misconfiguration' }, { status: 500 });
  }

  try {
    verify(token, ONTON_API_SECRET);
    // If verify() throws, we catch below.
  } catch (error) {
    logger.error(`Invalid token in /api/files/upload: ${error}`);
    return NextResponse.json({ message: 'Unauthorized: invalid token' }, { status: 401 });
  }

  // 3. If token is valid, proceed with file upload logic
  try {
    const { fields, files } = await parseFormdata(req);

    const rawBucket = fields.bucketName ?? 'onton';
    const rawSubfolder = fields.subfolder ?? '';
    const bucketName = Array.isArray(rawBucket) ? rawBucket[0] : rawBucket;
    const subfolder = Array.isArray(rawSubfolder) ? rawSubfolder[0] : rawSubfolder;

    const imageField = files.image;
    if (!imageField) {
      logger.log(`No file uploaded in route /api/files/upload`);
      return NextResponse.json({ message: 'No file uploaded.' }, { status: 400 });
    }

    const file = Array.isArray(imageField) ? imageField[0] : imageField;
    const formidableFile = file as FormidableFile;

    const fileData = fs.readFileSync(formidableFile.filepath);
    const finalFilename = subfolder
      ? `${subfolder}/${filePrefix()}${formidableFile.originalFilename}`
      : `${filePrefix()}${formidableFile.originalFilename}`;

    await minioClient.putObject(bucketName, finalFilename, fileData, formidableFile.size, {
      'Content-Type': formidableFile.mimetype ?? 'application/octet-stream',
    });

    const imageUrl = `${MINIO_PUBLIC_URL}/${bucketName}/${finalFilename}`;
    return NextResponse.json({ imageUrl });
  } catch (error) {
    logger.error(`An error occurred in route /api/files/upload: ${error}`);
    return NextResponse.json({ message: 'An error occurred.' }, { status: 500 });
  }
}
