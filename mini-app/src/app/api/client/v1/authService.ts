import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { redisTools } from "@/lib/redisTools"; // Assuming redisTools is available for Redis operations

const JWT_SECRET = process.env.CLIENT_API_JWT_SECRET!;

// Define error codes for JWT validation
const ERROR_CODES = {
  JWT_MISSING: { code: "JWT_MISSING", message: "Authorization token missing." },
  JWT_INVALID: { code: "JWT_INVALID", message: "Invalid or expired token." },
  JWT_VERIFICATION_FAILED: {
    code: "JWT_VERIFICATION_FAILED",
    message: "Token verification failed.",
  },
  JWT_BLACKLISTED: {
    code: "JWT_BLACKLISTED",
    message: "The token has been blacklisted and is no longer valid.",
  },
};

export async function validateJwtFromRequest(req: Request) {
  const authorization = req.headers.get("Authorization");

  if (!authorization) {
    return {
      success: false,
      error: {
        code: ERROR_CODES.JWT_MISSING.code,
        message: ERROR_CODES.JWT_MISSING.message,
      },
      response: NextResponse.json(
        {
          success: false,
          error: ERROR_CODES.JWT_MISSING,
        },
        { status: 401 }
      ),
    };
  }

  try {
    const token = authorization.split(" ")[1];

    // Check if the token is blacklisted
    const isBlacklisted = await redisTools.getCache(
      `${redisTools.cacheKeys.jwtBlacklist}${token}`
    );

    if (isBlacklisted) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.JWT_BLACKLISTED.code,
          message: ERROR_CODES.JWT_BLACKLISTED.message,
        },
        response: NextResponse.json(
          {
            success: false,
            error: ERROR_CODES.JWT_BLACKLISTED,
          },
          { status: 401 }
        ),
      };
    }

    // Verify the JWT token
    const payload = jwt.verify(token, JWT_SECRET);

    return { success: true, payload }; // Return success and payload if JWT is valid
  } catch (err) {
    return {
      success: false,
      error: {
        code: ERROR_CODES.JWT_INVALID.code,
        message: ERROR_CODES.JWT_INVALID.message,
      },
      response: NextResponse.json(
        {
          success: false,
          error: ERROR_CODES.JWT_INVALID,
        },
        { status: 401 }
      ),
    };
  }
}
