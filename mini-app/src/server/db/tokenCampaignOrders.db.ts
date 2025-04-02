import { db } from "@/db/db";
import { eq } from "drizzle-orm";
import { logger } from "@/server/utils/logger";
import {
  tokenCampaignOrders,
  TokenCampaignOrders,
  TokenCampaignOrdersInsert,
  TokenCampaignOrdersStatus,
} from "@/db/schema/tokenCampaignOrders";
import type { PgTransaction } from "drizzle-orm/pg-core/session";
import { PostgresJsQueryResultHKT } from "drizzle-orm/postgres-js";

/**
 * Insert a new row in the 'token_campaign_orders' table (outside a transaction).
 * Returns the inserted row or undefined if none.
 */
export const addOrder = async (orderData: TokenCampaignOrdersInsert): Promise<TokenCampaignOrders | undefined> => {
  try {
    const [inserted] = await db.insert(tokenCampaignOrders).values(orderData).returning().execute();

    if (inserted) {
      logger.log("Order inserted:", inserted);
      return inserted;
    }
    return undefined;
  } catch (error) {
    logger.error("Error inserting order:", error);
    throw error;
  }
};

/**
 * Insert a new row within a transaction.
 * Returns the inserted row or undefined if none.
 */
export const addOrderTx = async (
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  orderData: TokenCampaignOrdersInsert
): Promise<TokenCampaignOrders | undefined> => {
  const [inserted] = await tx.insert(tokenCampaignOrders).values(orderData).returning().execute();

  if (inserted) {
    logger.log("Order inserted in transaction:", inserted);
  }
  return inserted;
};

/**
 * Fetch an order by its numeric primary key (orders.id).
 * Returns a single TokenCampaignOrders object or undefined if not found.
 */
export const getOrderById = async (id: number): Promise<TokenCampaignOrders | undefined> => {
  try {
    const [order] = await db.select().from(tokenCampaignOrders).where(eq(tokenCampaignOrders.id, id)).execute();

    return order;
  } catch (error) {
    logger.error("Error fetching order by ID:", error);
    throw error;
  }
};

/**
 * Fetch orders by userId.
 * Returns an array of TokenCampaignOrders (could be empty).
 */
export const getOrdersByUserId = async (userId: number): Promise<TokenCampaignOrders[]> => {
  try {
    const ordersResult = await db.select().from(tokenCampaignOrders).where(eq(tokenCampaignOrders.userId, userId)).execute();

    return ordersResult;
  } catch (error) {
    logger.error("Error fetching orders by userId:", error);
    throw error;
  }
};

/**
 * Update an order by ID (outside a transaction).
 * Accepts a partial set of columns (Partial<TokenCampaignOrdersInsert>).
 * Returns the updated row or undefined if none.
 */
export const updateOrderById = async (
  id: number,
  updateData: Partial<TokenCampaignOrdersInsert>
): Promise<TokenCampaignOrders | undefined> => {
  try {
    const [updated] = await db
      .update(tokenCampaignOrders)
      .set(updateData)
      .where(eq(tokenCampaignOrders.id, id))
      .returning()
      .execute();

    if (updated) {
      logger.log("Order updated:", updated);
    }

    return updated;
  } catch (error) {
    logger.error("Error updating order by ID:", error);
    throw error;
  }
};

/**
 * Update an order by ID within a transaction.
 * Returns the updated row or undefined if none.
 */
export const updateOrderByIdTx = async (
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  id: number,
  updateData: Partial<TokenCampaignOrdersInsert>
): Promise<TokenCampaignOrders | undefined> => {
  const [updated] = await tx
    .update(tokenCampaignOrders)
    .set(updateData)
    .where(eq(tokenCampaignOrders.id, id))
    .returning()
    .execute();

  if (updated) {
    logger.log("Order updated in transaction:", updated);
  }

  return updated;
};

/**
 * Update only the 'status' field of an order by ID.
 * Uses the TokenCampaignOrdersStatus type from your schema.
 * Returns the updated row or undefined if none.
 */
export const updateOrderStatus = async (
  id: number,
  newStatus: TokenCampaignOrdersStatus
): Promise<TokenCampaignOrders | undefined> => {
  try {
    const [updated] = await db
      .update(tokenCampaignOrders)
      .set({ status: newStatus })
      .where(eq(tokenCampaignOrders.id, id))
      .returning()
      .execute();

    if (updated) {
      logger.log(`Order #${id} status updated to ${newStatus}`);
    }
    return updated;
  } catch (error) {
    logger.error(`Error updating order #${id} status:`, error);
    throw error;
  }
};

/**
 * Example: fetch all orders in a certain status.
 * (Optional, remove if not needed.)
 */
export const getOrdersByStatus = async (status: TokenCampaignOrdersStatus): Promise<TokenCampaignOrders[]> => {
  try {
    return await db.select().from(tokenCampaignOrders).where(eq(tokenCampaignOrders.status, status)).execute();
  } catch (error) {
    logger.error(`Error fetching orders by status (${status}):`, error);
    throw error;
  }
};

/**
 * Single export object with all methods
 */
export const tokenCampaignOrdersDB = {
  addOrder,
  addOrderTx,
  getOrderById,
  getOrdersByUserId,
  updateOrderById,
  updateOrderByIdTx,
  updateOrderStatus,
  getOrdersByStatus, // optional
};
