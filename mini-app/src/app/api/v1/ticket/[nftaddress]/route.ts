import { db } from "@/db/db";
import { tickets } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { type NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/server/auth";
import tonCenter from "@/server/routers/services/tonCenter";
import { decodePayloadToken, verifyToken } from "@/server/utils/jwt";
import { configProtected } from "@/server/config";
import dealRoomService from "@/server/routers/services/DealRoomService";

const updateTicketSchema = z.object({
  data: z.object({
    full_name: z.string(),
    telegram: z.string(),
    company: z.string(),
    position: z.string(),
  }),
  proof_token: z.string(),
});

export async function PUT(req: NextRequest, { params }: { params: { nftaddress: string } }) {
  try {
    const nft_address = params.nftaddress;

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
      console.warn(`Unauthorized access attempt for ticket update: ${nft_address}`);
      return unauthorized;
    }

    const proof_token = parsedData.data.proof_token;

    if (!proof_token) {
      return Response.json(
        {
          message: "Uer wallet ton proof is missing",
          code: "proof_token_required",
        },
        {
          status: 400,
        }
      );
    }

    let decoded;
    try {
      if (!(await verifyToken(proof_token))) {
        return Response.json(
          {
            message: "invalid token",
            code: "invalid_proof_token",
          },
          {
            status: 401,
          }
        );
      }

      decoded = {
        address: decodePayloadToken(proof_token)?.address,
      };
    } catch {
      return Response.json(
        {
          message: "invalid token",
          code: "invalid_proof_token",
        },
        {
          status: 401,
        }
      );
    }

    if (!decoded.address) {
      return Response.json(
        {
          message: "address is missing in token",
          code: "token_address_missing",
        },
        {
          status: 400,
        }
      );
    }

    const walletAddress = decoded.address;
    const nftItem = await tonCenter.fetchNFTItemsWithRetry(walletAddress, "", nft_address);
    // Check if nftItem is valid and contains nft_items
    if (!nftItem || !nftItem.nft_items || nftItem.nft_items.length === 0) {
      return Response.json(
        {
          message: "NFT not found or does not belong to wallet",
          code: "nft_item_update_fail",
        },
        { status: 401 }
      );
    }

    await db
      .update(tickets)
      .set({
        telegram: parsedData.data.data.telegram,
        name: parsedData.data.data.full_name,
        company: parsedData.data.data.company,
        position: parsedData.data.data.position,

        user_id: userId,
        updatedBy: `${userId}`,
        updatedAt: new Date(),
      })
      .where(eq(tickets.nftAddress, nft_address))
      .execute();
    // log user id ticket id and other info
    console.log(`route api ticket nft address : User ${userId} claimed ticket info for NFT ${nft_address}`);
    // Call the separate fetch function
    // const result = await dealRoomService.RefreshGuestList(configProtected?.dealRoomRefreshCode || "");
    // console.log(`route api ticket nft address : Deal room refresh result ${JSON.stringify(result)}`);
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
