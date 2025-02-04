import { db } from "@/db/db";
import { orders } from "@/db/schema";
import { and, eq, or } from "drizzle-orm";
import { is_dev_env, is_stage_env } from "../utils/evnutils";

const getEventOrders = async (event_uuid: string) => {
  return db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.event_uuid, event_uuid),
        or(eq(orders.order_type, "event_creation"), eq(orders.order_type, "event_capacity_increment"))
      )
    );
};

/**
 * Update the state of a single order, returning the rows that were updated.
 */
const updateOrderState = async (orderUuid: string, userId: number, newState: "cancelled" | "confirming") => {
  return db
    .update(orders)
    .set({ state: newState })
    .where(
      and(
        eq(orders.uuid, orderUuid),
        eq(orders.user_id, userId),
        or(eq(orders.state, "new"), eq(orders.state, "confirming"), eq(orders.state, "cancelled"))
      )
    )
    .returning({ uuid: orders.uuid })
    .execute();
};

/**
 * Find a single 'promote_to_organizer' order for a user.
 * Returns the latest one by .pop(), or null if none.
 */
const findPromoteToOrganizerOrder = async (userId: number) => {
  const rows = await db
    .select()
    .from(orders)
    .where(and(eq(orders.user_id, userId), eq(orders.order_type, "promote_to_organizer")))
    .execute();

  return rows.pop() ?? null; // Return the last item, or null if empty
};

/**
 * Create a new 'promote_to_organizer' order for a user,
 * and return the newly inserted row(s).
 */
const createPromoteToOrganizerOrder = async (userId: number, eventUuid: string) => {
  const price = is_dev_env() || is_stage_env() ? 0.0154 : 10;

  return db
    .insert(orders)
    .values({
      order_type: "promote_to_organizer",
      user_id: userId,
      payment_type: "TON",
      total_price: price,
      state: "new",
      event_uuid: eventUuid,
    })
    .returning()
    .execute();
};

/**
 * Find the first 'promote_to_organizer' order for a user.
 * Using Drizzle's new query API for convenience.
 */
const getPromoteToOrganizerOrder = async (userId: number) => {
  return db.query.orders.findFirst({
    where: and(eq(orders.user_id, userId), eq(orders.order_type, "promote_to_organizer")),
  });
};

const ordersDB = {
  getEventOrders,
  updateOrderState,
  findPromoteToOrganizerOrder,
  createPromoteToOrganizerOrder,
  getPromoteToOrganizerOrder,
};

export default ordersDB;
