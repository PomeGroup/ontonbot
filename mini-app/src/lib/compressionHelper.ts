import { gzip, brotliCompress } from "zlib";
import { promisify } from "util";

const gzipAsync = promisify(gzip);
const brotliAsync = promisify(brotliCompress);

export async function compressResponse(body: any, encoding: string) {
  encoding = encoding || ""; // Ensure encoding is a string

  if (encoding.includes("br")) {
    return {
      compressedBody: await brotliAsync(body),
      encoding: "br",
    };
  } else if (encoding.includes("gzip")) {
    return {
      compressedBody: await gzipAsync(body),
      encoding: "gzip",
    };
  } else {
    return {
      compressedBody: body,
      encoding: "identity",
    };
  }
}
