import { EventPaymentSelectType } from "@/db/schema/eventPayment";
import { EventRow } from "@/db/schema/events";
import { deployNftCollection } from "@/cronJobs/helper/deployNftCollection";
import { createTsCsbtActivity } from "@/cronJobs/helper/createTsCsbtActivity";

/**
 * Handles the logic for NFT or TSCSBT ticket types:
 * - NFT => Deploy new NFT collection if not already set
 * - TSCSBT => Create "ticket activity" on TonSociety if not already set
 */
export const handleTicketType = async (
  event: EventRow,
  paymentInfo?: EventPaymentSelectType
): Promise<{ collectionAddress: string | null; ticketActivityId: number | null }> => {
  if (!paymentInfo) {
    return { collectionAddress: null, ticketActivityId: null };
  }

  let updatedCollectionAddress = paymentInfo.collectionAddress || null;
  let ticketActivityId: number | null = null;

  if (paymentInfo.ticket_type === "NFT") {
    // (A) NFT Ticket => Deploy NFT Collection if not already done
    if (!paymentInfo.collectionAddress) {
      updatedCollectionAddress = await deployNftCollection(event, paymentInfo);
    }
  } else if (paymentInfo.ticket_type === "TSCSBT") {
    // (B) TSCSBT => Create separate "ticket activity" if not already created
    if (!paymentInfo.ticketActivityId) {
      ticketActivityId = await createTsCsbtActivity(event, paymentInfo);
    }
  }

  return { collectionAddress: updatedCollectionAddress, ticketActivityId };
};
