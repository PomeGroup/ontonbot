import { getAuthenticatedUser } from "@/server/auth";
import axios from "axios";
import { NextRequest } from "next/server";
import dealRoomService from "@/server/routers/services/DealRoomService";

export async function GET(req: NextRequest): Promise<Response> {
  try {
    const [, err] = getAuthenticatedUser();
    if (err && process.env.NODE_ENV === "production") {
      return err;
    }

    // Extract code from query or set default
    const url = new URL(req.url);
    const code =
      url.searchParams.get("code") || "2742f5902ad54152a969f5dac15d716d";

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
