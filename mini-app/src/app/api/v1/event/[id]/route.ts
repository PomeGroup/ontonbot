import { db } from "@/db/db";
import { nftItems, orders } from "@/db/schema";
import { removeKey } from "@/lib/utils";
import { getAuthenticatedUser } from "@/server/auth";
import { and, eq } from "drizzle-orm";
import { type NextRequest } from "next/server";
import { usersDB } from "@/server/db/users";
import tonCenter from "@/server/routers/services/tonCenter";
import { NFTItem } from "@/server/routers/services/tonCenter";
import { decodePayloadToken, verifyToken } from "@/server/utils/jwt";
import { OrderRow } from "@/db/schema/orders";
import { getByEventUuidAndUserId } from "@/server/db/eventRegistrants.db";
import "@/lib/gracefullyShutdown";
import eventDB from "@/server/db/events";
import ordersDB from "@/server/db/orders.db";
import { userRolesDB } from "@/server/db/userRoles.db";

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

  const event_registered = await getByEventUuidAndUserId(event_uuid, userId);

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
        const nft_db = (await db.select().from(nftItems).where(eq(nftItems.nft_address, nft.address)).execute()).pop();

        if (!nft_db) {
          console.error("Critical_API_V1_event NFT not found in our db ", nft.address);
        }

        if (
          event_registered &&
          (event_registered.status === "approved" || event_registered.status === "checkedin") &&
          nft_db?.owner === userId
        ) {
          valid_nfts_with_info.push(nft);
          return { valid_nfts_no_info, valid_nfts_with_info };
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

    // const unsafeEvent = await db.query.events.findFirst({
    //   where(fields, { eq }) {
    //     return eq(fields.event_uuid, event_uuid);
    //   },
    // });
    const unsafeEvent = await eventDB.fetchEventByUuid(event_uuid);

    if (!unsafeEvent?.event_uuid) {
      return Response.json({ error: "Event not found" }, { status: 400 });
    }

    const eventData = removeKey(unsafeEvent, "secret_phrase");
    const accessData = await userRolesDB.listActiveUserRolesForEvent("event", Number(eventData.event_id));
    const accessRoles = accessData.map(({ userId, role }) => ({
      user_id: userId,
      role: role,
    }));

    const organizer = await usersDB.selectUserById(eventData.owner as number);

    if (!organizer) {
      console.error(`Organizer not found for event ID: ${event_uuid}`);
      return Response.json({ error: `Organizer not found for event ID: ${event_uuid}` }, { status: 400 });
    }

    let event_payment_info;
    let isSoldOut: boolean | undefined;
    if (eventData.has_payment) {
      event_payment_info = await db.query.eventPayment.findFirst({
        where(fields, { eq }) {
          return eq(fields.event_uuid, eventData.event_uuid as string);
        },
      });
      if (event_payment_info) {
        const eventTicketingType = event_payment_info?.ticket_type;

        const ticketOrderTypeMap = {
          NFT: "nft_mint",
          TSCSBT: "ts_csbt_ticket",
        } as const;

        // Ensure TypeScript recognizes the valid key
        const ticketOrderType = ticketOrderTypeMap[eventTicketingType];

        // Use the shared sold-out check function
        const { isSoldOut: iso } = await ordersDB.checkIfSoldOut(event_uuid, ticketOrderType, eventData.capacity || 0);
        isSoldOut = iso;
      }
    }

    if (dataOnly === "true") {
      return Response.json(
        {
          ...eventData,
          organizer,
          eventTicket: event_payment_info,
          isSoldOut,
          accessRoles,
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
    let chosenNFTaddress = "";
    let needToUpdateTicket = false;
    let userHasTicket = false;
    let userOrder: OrderRow | undefined = undefined;
    let valid_nfts_no_info: NFTItem[] | never[] = [];
    let valid_nfts_with_info: NFTItem[] | never[] = [];

    if (event_payment_info?.ticket_type === "NFT") {
      const vaildNFTsResult = await getValidNfts(ownerAddress, event_payment_info?.collectionAddress!, userId, event_uuid);

      valid_nfts_no_info = vaildNFTsResult.valid_nfts_no_info;
      valid_nfts_with_info = vaildNFTsResult.valid_nfts_with_info;

      userHasTicket = !!valid_nfts_no_info.length || !!valid_nfts_with_info.length;

      userOrder = await db.query.orders.findFirst({
        where: and(
          eq(orders.user_id, userId),
          eq(orders.event_uuid, event_uuid),
          eq(orders.order_type, "nft_mint"),
          eq(orders.state, "processing")
        ),
      });

      needToUpdateTicket = !valid_nfts_with_info.length;

      if (userHasTicket && needToUpdateTicket) {
        chosenNFTaddress = valid_nfts_no_info[0].address;
        console.log(`User ${userId} can claim ${chosenNFTaddress} `);
      } else if (userHasTicket) {
        chosenNFTaddress = valid_nfts_with_info[0].address;
      }
    } else if (event_payment_info?.ticket_type === "TSCSBT") {
      const event_registrant = await getByEventUuidAndUserId(event_uuid, userId);
      userOrder = await db.query.orders.findFirst({
        where: and(
          eq(orders.user_id, userId),
          eq(orders.event_uuid, event_uuid),
          eq(orders.order_type, "ts_csbt_ticket"),
          eq(orders.state, "processing")
        ),
      });
      if (event_registrant?.status === "approved" || event_registrant?.status === "checkedin") {
        userHasTicket = true;
      }
    } else {
      throw new Error("Invalid Ticket Type");
    }

    const data = {
      ...eventData,
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

      accessRoles,
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
