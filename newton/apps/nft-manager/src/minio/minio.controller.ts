import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {MinioClientService} from "./minio.service";


@Controller('files')
export class MinioController {
  constructor(private readonly minio: MinioClientService) {}

  @UseInterceptors(FileInterceptor('image')) // Handle the file upload
  @Post('upload')
  async uploadFile(
    @UploadedFile() image: Express.Multer.File, // Uploaded file
    @Body('bucketName') bucketName: string, // Extract bucketName from the form data
    @Body('subfolder') subfolder: string, // Extract subfolder from the form data
  ) {
    console.log('Received image: ', image);
    console.log('Bucket Name: ', bucketName);
    console.log('Subfolder: ', subfolder);

    // Upload the image using MinIO service
    const imageUrl = await this.minio.uploadFile(
      bucketName || process.env.MINIO_ITEM_BUCKET || 'onton', // Use the bucketName from the request or fallback to env variable
      image.originalname,
      image.buffer,
      image.size,
      { mimetype: image.mimetype ,'Content-Type': image.mimetype}, // Metadata
      subfolder || '', // Subfolder if provided
    );

    // Return the public URL of the uploaded image
    return { imageUrl };
  }

  @UseInterceptors(FileInterceptor('video')) // Handle the video upload
  @Post('upload-video')
  async uploadVideo(
    @UploadedFile() video: Express.Multer.File,
    @Body('subfolder') subfolder: string, // Extract subfolder from the form data
  ) {
    // Check file type and size constraints for video
    if (video.mimetype !== "video/mp4") {
      throw new HttpException(
        "Only MP4 format is allowed.",
        HttpStatus.BAD_REQUEST,
      );
    }
    if (video.size > 5 * 1024 * 1024) { // 5 MB size limit
      throw new HttpException(
        "Video size exceeds the 5 MB limit.",
        HttpStatus.BAD_REQUEST,
      );
    }

    // Upload the video using the uploadVideo method in MinioClientService
    const videoUrl = await this.minio.uploadVideo(
      video.originalname,
      video.buffer,
      subfolder || 'event',
    );

    return { videoUrl };
  }
}

