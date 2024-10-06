// import { NextRequest, NextResponse } from 'next/server';
// import { getAbsoluteFSPath } from 'swagger-ui-dist';
// import { createReadStream } from 'fs';
// import path from 'path';
//
// // Serve static assets from `swagger-ui-dist`
// export async function GET(req: NextRequest) {
//     const url = new URL(req.url || '', 'http://localhost');
//     const assetPath = url.pathname.replace('/api/client/v1/swagger-docs', '');
//
//     const basePath = getAbsoluteFSPath();
//     const filePath = path.join(basePath, assetPath);
//
//     try {
//         const fileStream = createReadStream(filePath);
//         const headers = { 'Content-Type': getMimeType(filePath) }; // Set correct content type
//
//         return new NextResponse(fileStream, { headers });
//     } catch (err) {
//         return new NextResponse(`Error: ${err.message}`, { status: 404 });
//     }
// }
//
// function getMimeType(filePath: string): string {
//     if (filePath.endsWith('.css')) return 'text/css';
//     if (filePath.endsWith('.js')) return 'application/javascript';
//     if (filePath.endsWith('.html')) return 'text/html';
//     return 'text/plain';
// }
