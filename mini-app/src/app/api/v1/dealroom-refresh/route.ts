import { getAuthenticatedUser } from "@/server/auth";
import axios from "axios";
import { NextRequest } from "next/server";

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

    // Fetch data using the code
    const response = await axios.get(
      `https://letsgo.dealroomevents.com/v1/url/action?code=${code}`
    );

    if (response.status === 200 && response.data.success === true) {
      return Response.json({
        success: true,
        message: "share message sent successfully",
      });
    }

    return Response.json({ success: false, message: "share message failed" });
  } catch (error) {
    console.error("Error fetching URL:", error);
    return Response.json({
      success: false,
      message: "An error occurred while processing your request",
    });
  }
}
