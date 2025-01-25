import "dotenv/config";
export const BOT_TOKEN = process.env.BOT_TOKEN || "";
export const JWT_SECRET = process.env.ONTON_API_SECRET || ""; // for signing upload auth
export const API_BASE_URL = process.env.NEXT_PUBLIC_APP_BASE_URL || "";

// 5 requests/second => 200 ms per request for update profiles
export const REQUESTS_PER_SECOND = 5;
export const MS_PER_REQUEST = 1000 / REQUESTS_PER_SECOND;