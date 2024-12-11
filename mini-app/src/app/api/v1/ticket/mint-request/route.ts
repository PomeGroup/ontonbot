// import { db } from "@/db/db";
// import { eventTicket, tickets } from "@/db/schema";
// import { Address } from "@ton/core";
// import { and, eq } from "drizzle-orm";
// import { z } from "zod";

// const buyTicketSchema = z.object({
//   owner_address: z.string().refine((v) => Address.isAddress(Address.parse(v))),
//   boc: z.string(),
//   telegram: z.string(),
//   full_name: z.string(),
//   event_id: z.string().uuid(),
//   company: z.string().optional(),
//   position: z.string().optional(),
//   user_id: z.number(),
// });

// export async function POST(req: Request) {
//   const parsedData = buyTicketSchema.safeParse(await req.json());

//   if (!parsedData.success) {
//     return Response.json(
//       {
//         error: "invalid data",
//         errors: parsedData.error.flatten().fieldErrors,
//       },
//       {
//         status: 400,
//       }
//     );
//   }
//   const data = parsedData.data;

//   const eventTicketData = (
//     await db.select().from(eventTicket).where(eq(eventTicket.event_uuid, data.event_id)).execute()
//   ).pop();

//   if (!eventTicketData) {
//     return Response.json({ error: "Event ticket data not found" }, { status: 400 });
//   }

//   // check if user already has the ticket
//   const userHasTicket = (
//     await db
//       .select()
//       .from(tickets)
//       .where(
//         and(eq(tickets.user_id, parsedData.data.user_id), eq(tickets.event_uuid, parsedData.data.event_id))
//       )
//   ).pop();

//   if (userHasTicket) {
//     return Response.json({ error: "User already owns a ticket" }, { status: 400 });
//   }

//   try {
//     return await db.transaction(async (tx) => {
//       const ticket = (
//         await tx
//           .insert(tickets)
//           .values({
//             name: data.full_name,
//             company: data.company,
//             position: data.position,
//             event_uuid: data.event_id,
//             telegram: data.telegram,
//             ticket_id: eventTicketData?.id,
//             user_id: data.user_id,
//             status: "MINTING",
//             updatedBy: "system",
//           })
//           .returning()
//       ).pop();

//       if (!ticket) {
//         tx.rollback();
//       }

//       const body = JSON.stringify({
//         exBoc: data.boc,
//         participantAddress: data.owner_address,
//         collectionAddress: eventTicketData.collectionAddress,
//         ticketValue: eventTicketData.price,
//         ticket_id: ticket?.id,
//       });

//       // return the response returned by this fetch
//       const res = await fetch(`${process.env.NFT_MANAGER_BASE_URL}/validateTrx`, {
//         method: "POST",
//         body,
//         headers: {
//           "Content-Type": "application/json",
//         },
//       });

//       if (res.status !== 201) {
//         tx.rollback();
//       }

//       return res;
//     });
//   } catch (error) {
//     console.error(error);

//     return Response.json(
//       {
//         error: "an error occurred while validating your transaction",
//       },
//       {
//         status: 500,
//       }
//     );
//   }
// }
