import { NextRequest } from 'next/server';
import { Readable } from 'stream';
import type { IncomingMessage } from 'http';

// This helper reads the entire NextRequest body into memory (arrayBuffer),
// then creates a Readable stream. We attach the necessary Node.js fields so
// formidable treats it like an IncomingMessage.
export async function toNodeJsRequest(req: NextRequest): Promise<IncomingMessage> {
  // 1. Read the entire body into a Buffer
  const arrayBuffer = await req.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // 2. Create a Readable stream from that Buffer
  const stream = new Readable({
    read() {
      this.push(buffer);
      this.push(null);
    },
  });

  // 3. Cast to `any` so we can attach fields that IncomingMessage expects
  const nodeReq = stream as any;

  // 4. Copy over headers
  // NextRequest.headers is a Headers object; convert to a simple object
  const headers: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    headers[key.toLowerCase()] = value;
  });

  nodeReq.headers = headers;
  // method, url, and other props that formidable might use:
  nodeReq.method = req.method ?? 'POST';
  nodeReq.url = req.url ?? '/';
  nodeReq.httpVersion = '1.1';
  nodeReq.httpVersionMajor = 1;
  nodeReq.httpVersionMinor = 1;

  // 5. Return as IncomingMessage
  return nodeReq as IncomingMessage;
}
