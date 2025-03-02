import { callTaskImmediate } from "@/lib/callTaskImmediate";
import { usersDB } from "@/server/db/users";
import { OrderRow } from "@/db/schema/orders";
import { logger } from "@/server/utils/logger";
import eventDB from "@/server/db/events";

export const callTonfestForOnOntonPayment = async (ordr: OrderRow, eventUuid: string) => {
  // Only proceed if order.payment_type is not "STAR"
  if (ordr.payment_type !== "STAR") return;
  const eventData = await eventDB.fetchEventByUuid(eventUuid);
  // If there's a user_id, fetch the user for telegram username
  const user = ordr.user_id ? await usersDB.selectUserById(ordr.user_id) : null;
  const telegramUsername = user?.username ? `@${user.username}` : null;

  // Build the payload from your order & event context
  const payloadForTonfest = {
    trxHash: ordr.uuid, // or any unique ID as the "trxHash"
    userTelegramId: ordr.user_id ?? 0,
    telegramUsername,
    ownerWallet: ordr.owner_address,
    eventUuid: ordr.event_uuid,
    amount: ordr.total_price, // or any actual TON amount
    paymentType: ordr.payment_type, // "STAR"
  };

  // (a) Actually call TonFest once
  const immediateResult = await callTaskImmediate({
    apiName: "TONFEST",
    taskFunction: "addUserTicketFromOnton",
    payload: payloadForTonfest,
    itemType: "EVENT", // as requested
    itemId: eventData?.event_id ?? 0, // fallback to 0 if not found
  });

  // (b) Log the immediate call result
  logger.log(`TonFest immediate call result for order=${ordr.uuid}: ${JSON.stringify(immediateResult)}`);
};
