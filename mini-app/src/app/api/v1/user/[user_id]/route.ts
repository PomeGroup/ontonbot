import { db } from "@/db/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest, props: { params: Promise<{ user_id: string }> }) {
  const params = await props.params;
  const userId = parseInt(params.user_id);

  if (isNaN(userId)) {
    return Response.json({ message: "invalid user id" }, { status: 400 });
  }

  const user = await db.select().from(users).where(eq(users.user_id, userId)).execute();

  if (!user.length) {
    return Response.json({ message: "user not found" }, { status: 404 });
  }

  return Response.json(user[0]);
}
