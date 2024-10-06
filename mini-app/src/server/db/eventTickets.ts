import { db } from "@/db/db";
import { eventTicket } from "@/db/schema";
import { eq } from "drizzle-orm";

// Function to get an event ticket by its ID
export const getEventTicketById = async (ticketId: number) => {
    const result = await db
        .select()
        .from(eventTicket)
        .where(eq(eventTicket.id, ticketId))
        .limit(1)
        .execute();
    return result.length > 0 ? result[0] : null;
};