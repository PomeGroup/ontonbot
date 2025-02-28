import sharp from "sharp";

/**
 * Helper to resize (if width > 1920) and convert to JPEG (quality=85).
 * Put this function at the top level of handleShareOrganizer to avoid TS1252.
 */
export const processImageBuffer = async (buffer: Buffer): Promise<Buffer> => {
  let imageProcess = sharp(buffer);
  const metadata = await imageProcess.metadata();

  if (metadata.width && metadata.width > 1920) {
    imageProcess = imageProcess.resize(1920, null, {
      fit: "inside",
      withoutEnlargement: true,
    });
  }

  return await imageProcess
    .jpeg({ quality: 85, force: false })
    .toBuffer();
};
