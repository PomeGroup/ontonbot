import { z } from "zod";
import { NextResponse } from "next/server";
import tgService from "@/server/routers/services/telegramService";
import { redisTools } from "@/lib/redisTools";
import { selectUserByUsername } from "@/server/db/users";

// Define error codes for consistent error responses
const ERROR_CODES = {
  VALIDATION_FAILED: {
    code: "VALIDATION_FAILED",
    message: "Invalid input parameters.",
  },
  OTP_SEND_FAILED: {
    code: "OTP_SEND_FAILED",
    message: "Failed to send OTP via Telegram.",
  },
  OTP_CACHE_FAILED: {
    code: "OTP_CACHE_FAILED",
    message: "Error saving OTP to cache.",
  },
  UNKNOWN_ERROR: {
    code: "UNKNOWN_ERROR",
    message: "An unknown error occurred.",
  },
  METHOD_NOT_ALLOWED: {
    code: "METHOD_NOT_ALLOWED",
    message: "Method not allowed.",
  },
  TELEGRAM_ID_NOT_FOUND: {
    code: "TELEGRAMID_NOT_FOUND",
    message: "Telegram ID not found.",
  },
};

// Define success codes
const SUCCESS_CODES = {
  OTP_SENT: { code: "OTP_SENT", message: "OTP successfully sent." },
};

/**
 * @swagger
 * /sendCode:
 *   post:
 *     summary: Send OTP via Telegram using a Telegram handle
 *     description: Sends an OTP to the provided Telegram handle (e.g., `@Radiophp`).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               telegramHandle:
 *                 type: string
 *                 description: The Telegram handle (username) of the recipient, including the `@` symbol.
 *                 example: "@Radiophp"
 *     responses:
 *       200:
 *         description: OTP successfully sent.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Whether the OTP was successfully sent.
 *                   example: true
 *                 code:
 *                   type: string
 *                   description: Success code.
 *                   example: "OTP_SENT"
 *                 message:
 *                   type: string
 *                   description: Success message.
 *                   example: "OTP successfully sent to Telegram handle @Radiophp."
 *       400:
 *         description: Validation error for invalid input.
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
 *                       example: "VALIDATION_FAILED"
 *                     message:
 *                       type: string
 *                       description: Error message.
 *                       example: "Invalid input parameters."
 *       500:
 *         description: Server error while sending OTP or saving OTP to cache.
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
 *                       example: "OTP_SEND_FAILED"
 *                     message:
 *                       type: string
 *                       description: Error message.
 *                       example: "Failed to send OTP via Telegram."
 *                     details:
 *                       type: string
 *                       description: Detailed error information, if available.
 *                       example: "An unknown error occurred while sending OTP."
 */
export async function POST(req: Request) {
  try {
    // Define and validate the input schema using Zod for Telegram handle
    const schema = z.object({
      telegramHandle: z
        .string()
        .min(2)
        .regex(/^@[a-zA-Z0-9_]{5,}$/) // Ensure it starts with @ and meets username criteria
        .nonempty("Telegram handle is required"),
    });

    const parsed = schema.safeParse(await req.json());

    // Return validation errors if parsing fails
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: ERROR_CODES.VALIDATION_FAILED,
          details: parsed.error.errors.map((err) => ({
            path: err.path,
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    const { telegramHandle } = parsed.data;

    // Generate OTP code
    const code = Math.floor(10000 + Math.random() * 90000).toString();

    // Send OTP via Telegram
    try {
      const organizerInfo = await selectUserByUsername(
        telegramHandle.replace("@", "")
      );

      if (!organizerInfo) {
        return NextResponse.json(
          {
            success: false,
            error: ERROR_CODES.TELEGRAM_ID_NOT_FOUND,
          },
          { status: 500 }
        );
      }
      const sendCodeResponse = await tgService.sendCode(
        organizerInfo.user_id,
        code
      );

      if (!sendCodeResponse.success) {
        return NextResponse.json(
          {
            success: false,
            error: ERROR_CODES.OTP_SEND_FAILED,
          },
          { status: 500 }
        );
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred";
      return NextResponse.json(
        {
          success: false,
          error: ERROR_CODES.OTP_SEND_FAILED,
          details: errorMessage,
        },
        { status: 500 }
      );
    }

    // Cache OTP in Redis
    try {
      await redisTools.setCache(
        `${redisTools.cacheKeys.authApiOtp}${telegramHandle}`,
        code,
        redisTools.cacheLvl.authApiOtpTimeout
      );
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred";
      return NextResponse.json(
        {
          success: false,
          error: ERROR_CODES.OTP_CACHE_FAILED,
          details: errorMessage,
        },
        { status: 500 }
      );
    }

    // Successful response
    return NextResponse.json(
      {
        success: true,
        code: SUCCESS_CODES.OTP_SENT.code,
        message: `OTP successfully sent to Telegram handle ${telegramHandle}`,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
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
