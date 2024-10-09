import { NextResponse } from "next/server";

export async function GET() {
  try {
    const uptime = process.uptime();
    const timestamp = new Date().toISOString();

    return NextResponse.json({
      success: true,
      message: "pong",
      server: {
        uptime: `${Math.floor(uptime)} seconds`,
        timestamp,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: (error as Error).message || "An internal server error occurred",
      },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
