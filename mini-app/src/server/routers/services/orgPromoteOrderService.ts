import { db } from "@/db/db";
import { orders } from "@/db/schema";
import { updateUserRole } from "@/server/db/users";
import { logger } from "@/server/utils/logger";
import { InferSelectModel, eq } from "drizzle-orm";

type OrderRow = InferSelectModel<typeof orders>;

export async function orgPromoteProcessOrder(order: OrderRow): Promise<void> {
  try {
    await db.transaction(async (trx) => {
      if (!order.user_id) {
        logger.error("organizer_order_does_not_have_user_id order_uuid:", order.uuid);
        return;
      }

      if (order.state !== "processing") {
        logger.error("organizer_order_wrong_state order_uuid:", order.uuid, order.state);
        return;
      }

      const result = await updateUserRole(order.user_id, "organizer");

      // Mark Order as Completed
      if (result.success) {
        await trx
          .update(orders)
          .set({
            state: "completed",
          })
          .where(eq(orders.uuid, order.uuid))
          .execute();
      } else {
        logger.error("failed_to_promote_organizer", order.user_id, result.error);
      }
    });
  } catch (error) {
    logger.error("orgPromoteProcessOrder_failed", error);
  }
}
