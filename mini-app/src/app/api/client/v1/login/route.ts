import { z } from "zod";
import { NextResponse } from "next/server";
import { redisTools } from "@/lib/redisTools";
import { usersDB } from "@/server/db/users";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.CLIENT_API_JWT_SECRET!;

// Define error codes for consistent error responses
const ERROR_CODES = {
  METHOD_NOT_ALLOWED: {
    code: "METHOD_NOT_ALLOWED",
    message: "Method not allowed.",
  },
  VALIDATION_FAILED: {
    code: "VALIDATION_FAILED",
    message: "Invalid input parameters.",
  },
  OTP_INVALID: { code: "OTP_INVALID", message: "Invalid OTP." },
  USER_NOT_FOUND: { code: "USER_NOT_FOUND", message: "User not found." },
  OTP_DELETION_FAILED: {
    code: "OTP_DELETION_FAILED",
    message: "Error deleting OTP from cache.",
  },
  UNKNOWN_ERROR: {
    code: "UNKNOWN_ERROR",
    message: "An unknown error occurred.",
  },
};

// Define success codes
const SUCCESS_CODES = {
  LOGIN_SUCCESS: {
    code: "LOGIN_SUCCESS",
    message: "Login successful. JWT generated.",
  },
};

// Zod schema for validating the request body (using Telegram username)
const loginSchema = z.object({
  telegramUsername: z
    .string()
    .min(2)
    .regex(/^@[a-zA-Z0-9_]{5,}$/, "Invalid Telegram username format"), // Ensure it starts with @
  loginCode: z.string(),
});

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Login using OTP and get JWT
 *     description: Authenticates the user using Telegram OTP and provides a JWT.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               telegramUsername:
 *                 type: string
 *                 description: Telegram username (with @).
 *                 example: "@Radiophp"
 *               loginCode:
 *                 type: string
 *                 description: OTP code sent to Telegram.
 *     responses:
 *       200:
 *         description: JWT Token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Whether the login was successful.
 *                 token:
 *                   type: string
 *                   description: The generated JWT token.
 *                 code:
 *                   type: string
 *                   description: Success code.
 *                 message:
 *                   type: string
 *                   description: Success message.
 *       400:
 *         description: Validation error or user not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       description: Error code.
 *                     message:
 *                       type: string
 *                       description: Error message.
 *       500:
 *         description: Server error or OTP deletion failure.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       description: Error code.
 *                     message:
 *                       type: string
 *                       description: Error message.
 */
export async function POST(req: Request) {
  if (req.method !== "POST") {
    return NextResponse.json(
      { success: false, error: ERROR_CODES.METHOD_NOT_ALLOWED },
      { status: 405 }
    );
  }

  const body = await req.json(); // Parse the request body
  const parsedBody = loginSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      {
        success: false,
        error: ERROR_CODES.VALIDATION_FAILED,
        details: parsedBody.error.errors.map((err) => ({
          path: err.path,
          message: err.message,
        })),
      },
      { status: 400 }
    );
  }

  const { telegramUsername, loginCode } = parsedBody.data;

  try {
    // Fetch the OTP code from Redis cache using Telegram username
    const cachedCode = await redisTools.getCache(
      `${redisTools.cacheKeys.authApiOtp}${telegramUsername}`
    );

    if (!cachedCode || cachedCode !== loginCode) {
      return NextResponse.json(
        { success: false, error: ERROR_CODES.OTP_INVALID },
        { status: 401 }
      );
    }

    // Fetch the user from the database using the Telegram username
    const user = await usersDB.selectUserByUsername(telegramUsername.replace("@", ""));

    if (!user) {
      return NextResponse.json(
        { success: false, error: ERROR_CODES.USER_NOT_FOUND },
        { status: 404 }
      );
    }

    // Generate a JWT token
    const token = jwt.sign(
      { userId: user.user_id, telegramUsername },
      JWT_SECRET,
      { expiresIn: "3h" }
    );

    // Delete OTP from Redis after successful login
    try {
      await redisTools.deleteCache(
        `${redisTools.cacheKeys.authApiOtp}${telegramUsername}`
      );
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred";
      return NextResponse.json(
        {
          success: false,
          error: ERROR_CODES.OTP_DELETION_FAILED,
          details: errorMessage,
        },
        { status: 500 }
      );
    }

    // Return the generated JWT token
    return NextResponse.json(
      {
        success: true,
        code: SUCCESS_CODES.LOGIN_SUCCESS.code,
        message: SUCCESS_CODES.LOGIN_SUCCESS.message,
        token,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    console.error("Error during login:", errorMessage);
    return NextResponse.json(
      {
        success: false,
        error: ERROR_CODES.UNKNOWN_ERROR,
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

// Force dynamic rendering
export const dynamic = "force-dynamic";
