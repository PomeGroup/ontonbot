// import { NextRequest, NextResponse } from 'next/server';
// import { getAbsoluteFSPath } from 'swagger-ui-dist';
// import { readFileSync, createReadStream } from 'fs';
// import path from 'path';
//
// // Serve Swagger UI assets from `swagger-ui-dist`
// export async function GET(req: NextRequest) {
//     const urlPath = req.nextUrl.pathname.replace('/api/client/v1/swagger-docs', '');
//
//     // Serve Swagger JSON spec
//     if (urlPath === '/swagger.json') {
//         const swaggerSpec = {
//             openapi: '3.0.0',
//             info: {
//                 title: 'Your API',
//                 version: '1.0.0',
//                 description: 'Your API documentation',
//             },
//             servers: [
//                 {
//                     url: 'http://localhost:3000',
//                 },
//             ],
//         };
//         return NextResponse.json(swaggerSpec);
//     }
//
//     // Get the absolute path to the Swagger UI dist directory
//     const basePath = getAbsoluteFSPath();
//
//     // Serve `index.html` when the root Swagger docs URL is hit
//     if (urlPath === '' || urlPath === '/') {
//         const swaggerHtmlFile = path.join(basePath, 'index.html');
//         try {
//             let swaggerHtml = readFileSync(swaggerHtmlFile, 'utf-8');
//             swaggerHtml = swaggerHtml.replace(
//                 'https://petstore.swagger.io/v2/swagger.json',
//                 '/api/client/v1/swagger-docs/swagger.json'
//             );
//             return new NextResponse(swaggerHtml, {
//                 headers: { 'Content-Type': 'text/html' },
//             });
//         } catch (err) {
//             return new NextResponse(`Error: ${err.message}`, { status: 500 });
//         }
//     }
//
//     // Serve other static assets (CSS, JS, etc.) from `swagger-ui-dist`
//     const filePath = path.join(basePath, urlPath);
//     try {
//         const fileStream = createReadStream(filePath);
//         const headers = { 'Content-Type': getMimeType(filePath) };
//         return new NextResponse(fileStream, { headers });
//     } catch (err) {
//         return new NextResponse(`Error: ${err.message}`, { status: 404 });
//     }
// }
//
// // Helper function to get MIME type based on file extension
// function getMimeType(filePath: string): string {
//     if (filePath.endsWith('.css')) return 'text/css';
//     if (filePath.endsWith('.js')) return 'application/javascript';
//     if (filePath.endsWith('.html')) return 'text/html';
//     return 'text/plain';
// }
