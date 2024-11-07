import { HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common";

import type { ReadStream } from "fs";
import { Client } from "minio";
import { randomChars, stream2buffer } from "src/helper";

@Injectable()
export class MinioClientService {
  constructor() {
    this.logger = new Logger("MinioService");
    this.bucketNames = [
      process.env.MINIO_COLLECTION_BUCKET!,
      process.env.MINIO_ITEM_BUCKET!,
      process.env.MINIO_DOC_BUCKET!,
      process.env.MINIO_IMAGE_BUCKET!,
      process.env.MINIO_VIDEO_BUCKET!,
      process.env.MINIO_VIDEO_BUCKET!,
      process.env.MINIO_DOC_DEFAULT_BUCKET!,

    ];
    this.region = process.env.MINIO_REGION_NAME;
    this.premitedMimes = ["png", "jpeg", "jpg", "pdf", "mp4"];
  }

  private readonly logger: Logger;
  private readonly bucketNames: string[];
  private readonly region: string;
  private readonly premitedMimes: string[];

  public get client(): Client {
    return new Client({
      endPoint: process.env.MINIO_ENDPOINT,
      port: Number(process.env.MINIO_PORT),
      useSSL: false,
      accessKey: process.env.MINIO_ROOT_USER,
      secretKey: process.env.MINIO_ROOT_PASSWORD,
    });
  }

  private filePrefix(): string {
    return randomChars(5) + "_" + new Date().getTime() + "_";
  }

  async init(): Promise<void> {
    for (let i = 0; i < this.bucketNames.length; i++) {
      (await this.client.bucketExists(this.bucketNames[i])) ||
        (await this.client.makeBucket(this.bucketNames[i]), this.region);
    }
  }

  async uploadFile(
    bucketName: string = process.env.MINIO_DOC_DEFAULT_BUCKET || 'onton',
    filename: string,
    fileData: Buffer,
    size?: number,
    metaData?: Record<string, any>,
    subfolder: string = '', // Default subfolder to an empty string
  ) {
    // If subfolder is provided, include it in the path, otherwise use only the filename
    const fullFilename = subfolder
      ? `${subfolder}/${this.filePrefix() + filename}`
      : this.filePrefix() + filename;

    // Upload the file to the specified bucket and path (bucket/subfolder/file or bucket/file)
    console.log(bucketName, fullFilename, fileData, size, metaData);
    await this.client.putObject(
      bucketName,
      fullFilename,
      fileData,
      size,
      metaData,
    );

    // Return the public URL of the uploaded file
    return `${process.env.MINIO_PUBLIC_URL}/${bucketName}/${fullFilename}`;
  }


  public async getObject(
    objectName: string,
    bucketName: string,
  ): Promise<Buffer> {
    const objectStream = await this.client.getObject(bucketName, objectName);

    return stream2buffer(objectStream as ReadStream);
  }

  async delete(objetNames: string[], bucketName: string): Promise<void> {
    try {
      await this.client.removeObjects(bucketName, objetNames);
    } catch {
      throw new HttpException(
        "An error occured when deleting!",
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async downloadUrl(filename: string, bucketName: string): Promise<string> {
    return this.client.presignedGetObject(bucketName, filename);
  }

  /**
   * Uploads a video file to the MinIO server, ensuring it is an MP4 and under 5 MB.
   * @param filename - The name of the video file.
   * @param fileData - The file data as a Buffer.
   * @param subfolder - Optional subfolder within the video bucket.
   * @returns The public URL of the uploaded video.
   * @throws HttpException if the file is not an MP4 or exceeds 5 MB.
   */
  async uploadVideo(
    filename: string,
    fileData: Buffer,
    subfolder: string = "event", // Default subfolder for videos
  ): Promise<string> {
    const MAX_VIDEO_SIZE = 5 * 1024 * 1024; // 5 MB

    // Validate file type
    if (!filename.endsWith(".mp4")) {
      throw new HttpException(
        "Only MP4 format is allowed for video uploads.",
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validate file size
    if (fileData.length > MAX_VIDEO_SIZE) {
      throw new HttpException(
        "Video size exceeds the 5 MB limit.",
        HttpStatus.BAD_REQUEST,
      );
    }

    // Define metadata for video files
    const metaData = {
      "Content-Type": "video/mp4",
    };

    // Upload video using the uploadFile method
    const bucketName = process.env.MINIO_VIDEO_BUCKET || "onton-videos";
    return this.uploadFile(bucketName, filename, fileData, fileData.length, metaData, subfolder);
  }

}
