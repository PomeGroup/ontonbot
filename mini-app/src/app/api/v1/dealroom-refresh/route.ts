import { getAuthenticatedUser } from "@/server/auth";
import { NextRequest } from "next/server";
import dealRoomService from "@/server/routers/services/DealRoomService";
import { configProtected } from "@/server/config";

export async function GET(req: NextRequest): Promise<Response> {
  try {
    const [, err] = getAuthenticatedUser();
    if (err && process.env.NODE_ENV === "production") {
      return err;
    }

    // Extract code from query or set default
    const url = new URL(req.url);
    const code =
      url.searchParams.get("code") ||
      configProtected?.dealRoomRefreshCode ||
      "";
    // Call the separate fetch function
    const result = await dealRoomService.RefreshGuestList(code);
    return Response.json(result);
  } catch (error) {
    console.error("Error fetching URL:", error);
    return Response.json({
      success: false,
      message: "An error occurred while processing your request",
    });
  }
}

export const dynamic = "force-dynamic";
