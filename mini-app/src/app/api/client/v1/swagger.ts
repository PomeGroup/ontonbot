// // app/api/client/v1/swagger.ts
// import { NextApiRequest, NextApiResponse } from 'next';
// import swaggerUi from 'swagger-ui-express';
// import swaggerSpec from '@/lib/swagger'; // Adjust the path to your swagger.ts
//
// // API route handler for Swagger UI
// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   // Serve Swagger UI static files
//   if (req.method === 'GET') {
//     await new Promise<void>((resolve, reject) => {
//       swaggerUi.serve(req, res, (err) => {
//         if (err) reject(err);
//         else resolve();
//       });
//     });
//
//     // Display Swagger UI
//     swaggerUi.setup(swaggerSpec)(req, res);
//   } else {
//     // Handle other HTTP methods if needed
//     res.setHeader('Allow', ['GET']);
//     res.status(405).end(`Method ${req.method} Not Allowed`);
//   }
// }
//
// // Disable Next.js body parser for this route (required for Swagger UI)
// export const config = {
//   api: {
//     bodyParser: false,
//   },
// };
