import { orders } from "@/db/schema";
import { db } from "@/db/db";
import { and, eq, or } from "drizzle-orm";

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

const ordersDB = {
  getEventOrders,
}
export default ordersDB;