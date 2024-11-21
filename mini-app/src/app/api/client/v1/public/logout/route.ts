import { z } from "zod";
import { NextResponse } from "next/server";
import { redisTools } from "@/lib/redisTools";
import { validateJwtFromRequest } from "@/app/api/client/v1/authService";
import jwt from "jsonwebtoken";

// Define error codes for consistent error responses
const ERROR_CODES = {
  VALIDATION_FAILED: {
    code: "VALIDATION_FAILED",
    message: "Invalid input parameters.",
  },
  JWT_INVALID: {
    code: "JWT_INVALID",
    message: "Invalid or missing JWT token.",
  },
  LOGOUT_FAILED: {
    code: "LOGOUT_FAILED",
    message: "Failed to log out the user.",
  },
  UNKNOWN_ERROR: {
    code: "UNKNOWN_ERROR",
    message: "An unknown error occurred.",
  },
};

// Define success codes
const SUCCESS_CODES = {
  LOGOUT_SUCCESS: {
    code: "LOGOUT_SUCCESS",
    message: "User successfully logged out.",
  },
};

// Zod schema for validating the request body
const logoutSchema = z.object({
  telegramUserId: z
    .string()
    .regex(/^@[a-zA-Z0-9_]{5,}$/, "Invalid Telegram username format"),
});

/**
 * Logout endpoint (JWT protected)
 * Logs out the user by removing session-related data from Redis and blacklisting the JWT token.
 */
export async function POST(req: Request) {
    /* ----------------------------- OUT OF SERVICE ----------------------------- */
    return NextResponse.json({
      success: false,
      error: "out_of_service",}
    )

  // // Validate the JWT token
  // const jwtValidation = await validateJwtFromRequest(req);

  // // Check if JWT validation failed
  // if (!jwtValidation.success) {
  //   return jwtValidation.response; // Return the JWT error response
  // }

  // const authorization = req.headers.get("Authorization");

  // if (!authorization) {
  //   return NextResponse.json(
  //     {
  //       success: false,
  //       error: ERROR_CODES.JWT_INVALID,
  //     },
  //     { status: 401 }
  //   );
  // }
  // const token = authorization.split(" ")[1];
  // // Parse and validate the request body
  // const body = await req.json();
  // const parsedBody = logoutSchema.safeParse(body);

  // if (!parsedBody.success) {
  //   return NextResponse.json(
  //     {
  //       success: false,
  //       error: ERROR_CODES.VALIDATION_FAILED,
  //       details: parsedBody.error.errors.map((err) => ({
  //         path: err.path,
  //         message: err.message,
  //       })),
  //     },
  //     { status: 400 }
  //   );
  // }

  // const { telegramUserId } = parsedBody.data;

  // try {
  //   // Add JWT token to the blacklist with the remaining expiration time
  //   const decodedToken = jwt.decode(token) as { exp?: number };
  //   const tokenExpiration = decodedToken?.exp
  //     ? decodedToken.exp - Math.floor(Date.now() / 1000)
  //     : null;
  //   if (!tokenExpiration) {
  //     return NextResponse.json(
  //       {
  //         success: false,
  //         error: ERROR_CODES.JWT_INVALID,
  //       },
  //       { status: 401 }
  //     );
  //   }

  //   await redisTools.setCache(
  //     `${redisTools.cacheKeys.jwtBlacklist}${token}`,
  //     "blacklisted",
  //     tokenExpiration // Set cache expiry to the remaining token lifetime
  //   );

  //   // Invalidate user session or JWT token
  //   await redisTools.deleteCache(
  //     `${redisTools.cacheKeys.authApiOtp}${telegramUserId}`
  //   );

  //   return NextResponse.json(
  //     {
  //       success: true,
  //       code: SUCCESS_CODES.LOGOUT_SUCCESS.code,
  //       message: SUCCESS_CODES.LOGOUT_SUCCESS.message,
  //     },
  //     { status: 200 }
  //   );
  // } catch (error: unknown) {
  //   const errorMessage =
  //     error instanceof Error
  //       ? error.message
  //       : ERROR_CODES.UNKNOWN_ERROR.message;
  //   return NextResponse.json(
  //     {
  //       success: false,
  //       error: ERROR_CODES.UNKNOWN_ERROR,
  //       details: errorMessage,
  //     },
  //     { status: 500 }
  //   );
  // }
}

export const dynamic = "force-dynamic";