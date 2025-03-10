import { NextRequest } from "next/server";
import formidable, { Fields, Files } from "formidable";
import { toNodeJsRequest } from "@/app/api/files/helpers/toNodeJsRequest";
import { logger } from "@/server/utils/logger";

/**
 * 1) parseMultipartForm:
 *    - Reads the entire request body into a Buffer
 *    - Wraps it in a Node.js Readable stream
 *    - Parses with Formidable
 */
export const parseMultipartForm = async (req: NextRequest): Promise<{ fields: Fields; files: Files }> => {
  const contentType = req.headers.get("content-type") || "";
  if (!contentType.startsWith("multipart/form-data")) {
    throw new Error("Must be multipart/form-data");
  }

  // Create Formidable instance (10 MB limit, etc.)
  const form = formidable({
    maxFileSize: 10 * 1024 * 1024,
    keepExtensions: true,
    multiples: false,
  });
  const nodeReq = await toNodeJsRequest(req);

  // Parse the Node.js stream with Formidable
  return new Promise((resolve, reject) => {
    form.parse(nodeReq, (err, fields, files) => {
      if (err) {
        logger.log(`Error parsing formData: ${err}`);
        return reject(err);
      }
      resolve({ fields, files });
    });
  });
};
