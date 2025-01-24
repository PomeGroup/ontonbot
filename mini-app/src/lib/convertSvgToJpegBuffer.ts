import axios from "axios";
import sharp from "sharp";

/**
 * Fetches an SVG from the given URL, converts it to a JPEG buffer in-memory.
 */
export const convertSvgToJpegBuffer = async (svgUrl: string): Promise<Buffer> => {
  // 1) Fetch the SVG as an ArrayBuffer (raw bytes) with axios
  const response = await axios.get<ArrayBuffer>(svgUrl, { responseType: "arraybuffer" });

  // 2) Extract the raw data as a Buffer
  const svgBuffer = Buffer.from(response.data);

  // 3) Convert the buffer to JPEG using sharp
  // 4) Return the converted buffer
  return await sharp(svgBuffer).jpeg().toBuffer();
};
