import { db } from "@/db/db";
import { tickets } from "@/db/schema";
import { Address } from "@ton/core";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { type NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/server/auth";

const updateTicketSchema = z.object({
  full_name: z.string(),
  telegram: z.string(),
  company: z.string(),
  position: z.string(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: { nftaddress: string } }
) {
  try {
    const nftaddress = params.nftaddress;
    /* -------------------------------------------------------------------------- */
    const body = await req.json();
    const parsedData = updateTicketSchema.safeParse(body);
    if (!parsedData.success) {
      return Response.json(
        { error: "invalid input" },
        {
          status: 400,
        }
      );
    }
    /* -------------------------------------------------------------------------- */
    /* ---------------------------------- Auth ---------------------------------- */
    const [userId, unauthorized] = getAuthenticatedUser();
    /* -------------------------------------------------------------------------- */

    if (unauthorized) {
      console.warn(
        `Unauthorized access attempt for ticket update: ${nftaddress}`
      );
      return unauthorized;
    }

    await db
      .update(tickets)
      .set({
        telegram: parsedData.data.telegram,
        name: parsedData.data.full_name,
        company: parsedData.data.company,
        position: parsedData.data.position,

        user_id: userId,
        updatedBy: `${userId}`,
        updatedAt: new Date(),
      })
      .where(eq(tickets.nftAddress, nftaddress))
      .execute();

    return Response.json({ message: "user ticked updated" });
  } catch (error) {
    if (error instanceof SyntaxError)
      return Response.json(
        {
          error: "invalid_body",
          message: "invalid json body provided",
        },
        { status: 400 }
      );
  }
}
