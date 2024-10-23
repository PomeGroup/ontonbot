import { db } from "@/db/db";
import { tickets } from "@/db/schema";
import { eq, and } from "drizzle-orm";
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

    const result = await db
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
      .where(
        and(
          eq(tickets.nftAddress, nftaddress),
          eq(tickets.event_uuid, "cc3797ba-f908-450b-a123-e6bd81fa84b8")
        )
      )
      .execute();
    

    return Response.json({ message: "user ticket info updated" });
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
