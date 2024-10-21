import { db } from "@/db/db";
import { orders, tickets } from "@/db/schema";
import { removeKey } from "@/lib/utils";
import { getAuthenticatedUser } from "@/server/auth";
import { and, eq, or, sql } from "drizzle-orm";
import { type NextRequest } from "next/server";
import { usersDB } from "@/server/db/users";
import tonCenter from "@/server/routers/services/tonCenter";
import { NFTItem } from "@/server/routers/services/tonCenter";

// Helper function for retrying the HTTP request
async function getRequestWithRetry(
  uri: string,
  retries: number = 3
): Promise<any> {
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
  userId: number
): Promise<{ valid_nfts_no_info: NFTItem[]; valid_nfts_with_info: NFTItem[] }> {
  const wallet_nfts = await tonCenter.fetchNFTItemsWithRetry(
    ownerAddress,
    collectionAddress
  );
  const valid_nfts_no_info: NFTItem[] = [];
  const valid_nfts_with_info: NFTItem[] = [];

  if (wallet_nfts?.nft_items) {
    for (const nft of wallet_nfts.nft_items) {
      try {
        const nft_data = await getRequestWithRetry(nft.content.uri);
        const name: string = nft_data.name;

        // Query the tickets database for this NFT address
        const ticketsResult = await db
          .select()
          .from(tickets)
          .where(eq(tickets.nftAddress, nft.address))
          .execute();

        // Check if there's exactly one ticket for this NFT
        if (ticketsResult.length !== 1) {
          console.error(
            `Unexpected number of tickets found for NFT ${nft.address}`
          );
          continue;
        }

        const ticket = ticketsResult[0];

        // Ensure the ticket is UNUSED and the NFT is not revoked
        if (
          ticket &&
          ticket.status === "UNUSED" &&
          !name.toLowerCase().includes("revoked")
        ) {
          if (ticket.user_id === userId) {
            valid_nfts_with_info.push(nft);
          } else {
            valid_nfts_no_info.push(nft);
          }
        }
      } catch (error) {
        console.error(`Error fetching NFT data or querying database: ${error}`);
      }
    }
  }

  return { valid_nfts_no_info, valid_nfts_with_info };
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; } }
) {
  try {
    const eventId = params.id;
    const searchParams = req.nextUrl.searchParams;

    const dataOnly = searchParams.get("data_only") as "true" | undefined;

    const unsafeEvent = await db.query.events.findFirst({
      where(fields, { eq }) {
        return eq(fields.event_uuid, eventId);
      },
    });

    if (!unsafeEvent?.event_uuid) {
      return Response.json({ error: "Event not found" }, { status: 400 });
    }

    const event = removeKey(unsafeEvent, "secret_phrase");

    const organizer = await usersDB.selectUserById(event.owner as number);

    if (!organizer) {
      console.error(`Organizer not found for event ID: ${eventId}`);
      return Response.json(
        { error: `Organizer not found for event ID: ${eventId}` },
        { status: 400 }
      );
    }

    let ticket;
    if (event.ticketToCheckIn) {
      ticket = await db.query.eventTicket.findFirst({
        where(fields, { eq }) {
          return eq(fields.event_uuid, event.event_uuid as string);
        },
      });
      if (!ticket) {
        console.warn(`Ticket not found for event ID: ${eventId}`);
      }
    }

    const soldTicketsCount = await db
      .select({ count: sql`count(*)`.mapWith(Number) })
      .from(orders)
      .where(
        and(
          eq(orders.event_uuid, event.event_uuid as string),
          or(
            eq(orders.state, "minted"),
            eq(orders.state, "created"),
            eq(orders.state, "mint_request")
          )
        )
      )
      .execute();

    const isSoldOut =
      (soldTicketsCount[0].count as unknown as number) >=
      (ticket?.count as unknown as number);

    if (dataOnly === "true") {
      return Response.json(
        {
          ...event,
          organizer,
          eventTicket: ticket,
          isSoldOut,
        },
        {
          status: 200,
        }
      );
    }

    const [userId, unauthorized] = getAuthenticatedUser();

    if (unauthorized) {
      console.warn(`Unauthorized access attempt for event ID: ${eventId}`);
      return unauthorized;
    }

    const ownerAddress = searchParams.get('owner_address')
    if (!ownerAddress) {
      return Response.json({
        message: 'owner address is required'
      }, {
        status: 401
      })
    }

    const { valid_nfts_no_info, valid_nfts_with_info } = await getValidNfts(
      ownerAddress,
      event.collection_address!,
      userId
    );
    const userHasTicket =
      !!valid_nfts_no_info.length || !!valid_nfts_with_info.length;
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
            eq(orders.event_ticket_id, ticket?.id as number),
            or(
              eq(orders.state, "created"),
              eq(orders.state, "minted"),
              eq(orders.state, "mint_request")
            )
          )
        )
        .execute()
    ).pop();

    const needToUpdateTicket = !valid_nfts_with_info.length;

    let chosenNFTaddress = '';
    if (userHasTicket && needToUpdateTicket) {
      chosenNFTaddress = valid_nfts_no_info[0].address;
    } else if (userHasTicket) {
      chosenNFTaddress = valid_nfts_with_info[0].address;
    }

    const data = {
      ...event,
      userHasTicket: userHasTicket,
      needToUpdateTicket: needToUpdateTicket,
      chosenNFTaddress,
      orderAlreadyPlace: !!userOrder,
      organizer,
      eventTicket: ticket,
      isSoldOut,
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
