import { db } from "@/db/db";
import { eventRegistrants, orders, tickets } from "@/db/schema";
import { removeKey } from "@/lib/utils";
import { getAuthenticatedUser } from "@/server/auth";
import { and, eq, or, sql } from "drizzle-orm";
import { type NextRequest } from "next/server";
import { usersDB } from "@/server/db/users";
import tonCenter from "@/server/routers/services/tonCenter";
import { NFTItem } from "@/server/routers/services/tonCenter";

import { decodePayloadToken, verifyToken } from "@/server/utils/jwt";

// Helper function for retrying the HTTP request
async function getRequestWithRetry(uri: string, retries: number = 3): Promise<any> {
  let attempt = 0;
  while (attempt < retries) {
    try {
      const response = await fetch(uri);
      if (!response.ok) {
        throw new Error(`Request failed with status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      attempt++;
      if (attempt >= retries) {
        throw error;
      }
    }
  }
}

async function getValidNfts(
  ownerAddress: string,
  collectionAddress: string,
  userId: number,
  event_uuid: string
): Promise<{ valid_nfts_no_info: NFTItem[]; valid_nfts_with_info: NFTItem[] }> {
  const wallet_nfts = await tonCenter.fetchNFTItemsWithRetry(ownerAddress, collectionAddress);

  const valid_nfts_no_info: NFTItem[] = [];
  const valid_nfts_with_info: NFTItem[] = [];

  const event_registered = await db
    .select()
    .from(eventRegistrants)
    .where(and(eq(eventRegistrants.event_uuid, event_uuid), eq(eventRegistrants.user_id, userId)))
    .execute();

  if (wallet_nfts?.nft_items) {
    for (const nft of wallet_nfts.nft_items) {
      try {
        const nft_data = await getRequestWithRetry(nft.content.uri);
        const name: string = nft_data.name;

        if (name.toLowerCase().includes("revoked")) {
          continue;
        }
        // Query the tickets database for this NFT address
        // const ticketsResult = await db.select().from(tickets).where(eq(tickets.nftAddress, nft.address)).execute();

        // Check if there's exactly one ticket for this NFT
        // if (ticketsResult.length !== 1) {
        //   console.error(`Unexpected number of tickets found for NFT ${nft.address}`);
        //   continue;
        // }

        // const ticket = ticketsResult[0];

        // Ensure the ticket is UNUSED and the NFT is not revoked
        // if (ticket && ticket.status === "UNUSED" && !name.toLowerCase().includes("revoked")) {
        //   if (ticket.user_id === userId) {
        //     valid_nfts_with_info.push(nft);
        //   } else {
        //     valid_nfts_no_info.push(nft);
        //   }
        // }

        /* -------------------------------------------------------------------------- */
        /*                                 NEW LOGIC🐈                                */
        /* -------------------------------------------------------------------------- */

        if (
          event_registered.length &&
          (event_registered[0].status === "approved" || event_registered[0].status === "checkedin")
        ) {
          valid_nfts_with_info.push(nft);
        } else {
          valid_nfts_no_info.push(nft);
        }
      } catch (error) {
        console.error(`Error fetching NFT data or querying database: ${error}`);
      }
    }
  }

  return { valid_nfts_no_info, valid_nfts_with_info };
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const event_uuid = params.id;
    const searchParams = req.nextUrl.searchParams;
    const dataOnly = searchParams.get("data_only") as "true" | undefined;

    const unsafeEvent = await db.query.events.findFirst({
      where(fields, { eq }) {
        return eq(fields.event_uuid, event_uuid);
      },
    });

    if (!unsafeEvent?.event_uuid) {
      return Response.json({ error: "Event not found" }, { status: 400 });
    }

    const event = removeKey(unsafeEvent, "secret_phrase");

    const organizer = await usersDB.selectUserById(event.owner as number);

    if (!organizer) {
      console.error(`Organizer not found for event ID: ${event_uuid}`);
      return Response.json({ error: `Organizer not found for event ID: ${event_uuid}` }, { status: 400 });
    }

    let event_payment_info;
    if (event.ticketToCheckIn) {
      event_payment_info = await db.query.eventPayment.findFirst({
        where(fields, { eq }) {
          return eq(fields.event_uuid, event.event_uuid as string);
        },
      });
      if (!event_payment_info) {
        console.warn(`Ticket not found for event ID: ${event_uuid}`);
      }
    }

    const soldTicketsCount = await db
      .select({ count: sql`count(*)`.mapWith(Number) })
      .from(eventRegistrants)
      .where(
        and(
          eq(eventRegistrants.event_uuid, event.event_uuid),
          or(eq(eventRegistrants.status, "approved"), eq(eventRegistrants.status, "checkedin"))
        )
      )
      .execute();

    const isSoldOut = (soldTicketsCount[0].count as unknown as number) >= (event.capacity || 0);

    if (dataOnly === "true") {
      return Response.json(
        {
          ...event,
          organizer,
          eventTicket: event_payment_info,
          isSoldOut,
        },
        {
          status: 200,
        }
      );
    }

    const [userId, unauthorized] = getAuthenticatedUser();

    if (unauthorized) {
      console.warn(`Unauthorized access attempt for event ID: ${event_uuid}`);
      return unauthorized;
    }

    const proof_token = searchParams.get("proof_token");

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

    const ownerAddress = decoded.address;

    const { valid_nfts_no_info, valid_nfts_with_info } = await getValidNfts(
      ownerAddress,
      event_payment_info?.collectionAddress!,
      userId,
      event_uuid
    );

    const userHasTicket = !!valid_nfts_no_info.length || !!valid_nfts_with_info.length;
    // const userHasTicket = (
    //   await db
    //     .select()
    //     .from(tickets)
    //     .where(
    //       and(
    //         eq(tickets.event_uuid, event.event_uuid as string),
    //         eq(tickets.user_id, userId)
    //       )
    //     )
    //     .orderBy(asc(tickets.created_at))
    //     .execute()
    // ).pop();

    const userOrder = (
      await db
        .select()
        .from(orders)
        .where(
          and(
            eq(orders.user_id, userId),
            eq(orders.event_uuid, event_uuid),
            eq(orders.order_type, "nft_mint"),
            eq(orders.state, "processing")
          )
        )
        .execute()
    ).pop();

    const needToUpdateTicket = !valid_nfts_with_info.length;

    let chosenNFTaddress = "";
    if (userHasTicket && needToUpdateTicket) {
      chosenNFTaddress = valid_nfts_no_info[0].address;
      console.log(`User ${userId} can claim ${chosenNFTaddress} `);
    } else if (userHasTicket) {
      chosenNFTaddress = valid_nfts_with_info[0].address;
    }

    const data = {
      ...event,
      userHasTicket: userHasTicket,
      needToUpdateTicket: userHasTicket && needToUpdateTicket,
      chosenNFTaddress,
      orderAlreadyPlace: !!userOrder,
      organizer,
      eventTicket: event_payment_info,
      isSoldOut,

      ownerAddress,
      usedCollectionAddress: event_payment_info?.collectionAddress!,
      valid_nfts_no_info,
      valid_nfts_with_info,
    };

    return Response.json(data, {
      status: 200,
    });
  } catch (error) {
    console.error(`Error processing request for event ID: ${params.id}`, error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
