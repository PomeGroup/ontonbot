import { db } from "@/db/db";
import { tickets } from "@/db/schema";
import { TicketStatus } from "@/db/enum";
import { eq } from "drizzle-orm";

// Function to get a ticket by its UUID
export const getTicketByUuid = async (ticketUuid: string) => {
  // Execute the query to select the ticket by UUID
  const ticket = await db
    .select()
    .from(tickets)
    .where(eq(tickets.order_uuid, ticketUuid))
    .limit(1)
    .execute();

  // Return the ticket or null if not found
  return ticket.length > 0 ? ticket[0] : null;
};

type CheckInTicketResult =
    | { status: TicketStatus | null }
    | { alreadyCheckedIn: boolean };

// Function to check in a ticket (update its status to "USED")
export const checkInTicket = async (ticketUuid: string): Promise<CheckInTicketResult | null> => {
  // First, fetch the current status of the ticket
  const ticket = await db
      .select({ status: tickets.status , order_uuid: tickets.order_uuid , id: tickets.id })
      .from(tickets)
      .where(eq(tickets.order_uuid, ticketUuid))
      .limit(1)
      .execute();

  // If the ticket is not found, return null
  if (ticket.length === 0) {
    return null;
  }

  // If the ticket is already "USED", return a specific response
  if (ticket[0].status === "USED") {
    return { alreadyCheckedIn: true };
  }

  // Otherwise, update the ticket status to "USED"
  const result = await db
      .update(tickets)
      .set({ status: "USED" as TicketStatus })
      .where(eq(tickets.order_uuid, ticketUuid))
      .returning({ status: tickets.status })
      .execute();

  // Return the result of the update operation (whether it was successful)
  return result.length > 0 ? ticket[0] : null;
};