import { router, initDataProtectedProcedure } from "../trpc";
import { z } from "zod";
import { campaignTypes } from "@/db/enum";
import { tokenCampaignNftCollectionsDB } from "@/server/db/tokenCampaignNftCollections.db";
import { tokenCampaignSpinPackagesDB } from "@/server/db/tokenCampaignSpinPackages.db";
import { secureWeightedRandom } from "@/lib/secureWeightedRandom";
import { tokenCampaignUserSpinsDB } from "@/server/db/tokenCampaignUserSpins.db";
import { db } from "@/db/db";
import { tokenCampaignOrdersDB } from "@/server/db/tokenCampaignOrders.db";
import { TokenCampaignOrdersStatus } from "@/db/schema/tokenCampaignOrders";
import { TRPCError } from "@trpc/server";

export const campaignRouter = router({
  /**
   * Get Campaign Collections by Type
   * Receives a `campaignType` and returns matching collections.
   */
  getCollectionsByCampaignType: initDataProtectedProcedure
    .input(
      z.object({
        campaignType: z.enum(campaignTypes.enumValues),
      })
    )
    .query(async ({ input }) => {
      const { campaignType } = input;
      return tokenCampaignNftCollectionsDB.getCollectionsByCampaignType(campaignType);
    }),
  /**
   * Get *active* spin packages by campaignType.
   */
  getActiveSpinPackagesByCampaignType: initDataProtectedProcedure
    .input(
      z.object({
        campaignType: z.enum(campaignTypes.enumValues),
      })
    )
    .query(async ({ input }) => {
      const { campaignType } = input;
      return tokenCampaignSpinPackagesDB.getActiveSpinPackagesByCampaignType(campaignType);
    }),

  spinForNft: initDataProtectedProcedure
    .input(
      z.object({
        campaignType: z.enum(campaignTypes.enumValues),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { campaignType } = input;
      const userId = ctx.user?.user_id;
      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "User is not logged in." });
      }

      return await db.transaction(async (tx) => {
        // 1) Find an existing *unused* spin row
        const spinRow = await tokenCampaignUserSpinsDB.getUnusedSpinForUserTx(tx, userId);
        if (!spinRow) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `No unused spin found for userId ${userId}.`,
          });
        }

        // 2) Fetch eligible collections for the campaign
        const allCollections = await tokenCampaignNftCollectionsDB.getCollectionsByCampaignType(campaignType);
        const itemsWithWeight = allCollections.map((c) => ({
          ...c,
          weight: c.probabilityWeight,
        }));

        // 3) Weighted random pick
        const selectedCollection = secureWeightedRandom(itemsWithWeight);

        // 4) Assign the chosen collection to the spin row
        await tokenCampaignUserSpinsDB.updateUserSpinByIdTx(tx, spinRow.id, {
          nftCollectionId: selectedCollection.id,
        });

        // 5) Increment salesCount (and optionally salesVolume) for this collection
        await tokenCampaignNftCollectionsDB.incrementCollectionSalesTx(tx, selectedCollection.id);

        // 6) Return the chosen collection
        return selectedCollection;
      });
    }),

  /**
   * 1) Add a new order (must be logged in).
   */
  addOrder: initDataProtectedProcedure
    .input(
      z.object({
        spinPackageId: z.number(),
        walletAddress: z.string().optional().default(""),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Ensure the user is logged in (ctx.user set by your auth)
      const userId = ctx.user?.user_id;
      if (!userId) {
        throw new Error("User not logged in or missing user ID.");
      }

      const { spinPackageId, walletAddress } = input;
      const spinPackage = await tokenCampaignSpinPackagesDB.getSpinPackageById(spinPackageId);
      if (!spinPackage) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Spin package with ID ${spinPackageId} not found.`,
        });
      }
      // Build the TokenCampaignOrdersInsert object
      // (some columns have defaults in DB, e.g. status="new")
      const orderData = {
        userId,
        spinPackageId,
        finalPrice: spinPackage.price.toString(),
        defaultPrice: spinPackage.price.toString(),
        wallet_address: walletAddress,
        status: "new" as TokenCampaignOrdersStatus,
        currency: spinPackage.currency,
      };

      // Insert into the DB
      const order = await tokenCampaignOrdersDB.addOrder(orderData);
      if (!order) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create order.",
        });
      }
      return order;
    }),

  /**
   * 2) Get a single order by its numeric ID.
   */
  getOrder: initDataProtectedProcedure
    .input(
      z.object({
        orderId: z.number(),
      })
    )
    .query(async ({ input, ctx }) => {
      const userId = ctx.user?.user_id;
      if (!userId) {
        throw new Error("User not logged in or missing user ID.");
      }

      const { orderId } = input;

      // Fetch from the DB
      const order = await tokenCampaignOrdersDB.getOrderById(orderId);
      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Order with ID ${orderId} not found.`,
        });
      }

      // Optional: check if order.userId matches current userId
      if (order.userId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Order with ID ${orderId} does not belong to the current user.`,
        });
      }

      return order;
    }),
  /**
   * 3) Get all collections with count for a given user ID.
   */
  getUserCollectionsResult: initDataProtectedProcedure
    .input(
      z.object({
        campaignType: z.enum(campaignTypes.enumValues),
      })
    )
    .query(async ({ input, ctx }) => {
      const userId = ctx.user?.user_id;
      if (!userId) {
        throw new Error("User not logged in or missing user ID.");
      }

      // If you only want certain campaign, pass input.campaignType
      const result = await tokenCampaignUserSpinsDB.getAllCollectionsWithUserCount(userId, input.campaignType);
      return result;
    }),

  /**
   * 4) Get how many spins a user has used vs. remaining.
   * Optionally filter by a specific spinPackageId.
   */
  getUserSpinStats: initDataProtectedProcedure
    .input(
      z.object({
        spinPackageId: z.number().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const userId = ctx.user?.user_id;

      const { spinPackageId } = input;

      // Fetch aggregator data from DB
      const stats = await tokenCampaignUserSpinsDB.getUserSpinStats(userId, spinPackageId);
      return stats; // { used, remaining }
    }),
  /**
   * Only allows transitioning an order to "confirming" or "cancel".
   */
  updateOrderStatusConfirmCancel: initDataProtectedProcedure
    .input(
      z.object({
        orderId: z.number(),
        status: z.enum(["confirming", "cancelled"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user?.user_id;

      const { orderId, status } = input;
      const order = await tokenCampaignOrdersDB.getOrderById(orderId);
      if (!order) {
        throw new TRPCError({ code: "NOT_FOUND", message: `Order #${orderId} not found.` });
      }

      if (order.userId !== userId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You are not the owner of this order." });
      }

      // Only allow switching from "new" or "confirming" to the new status.
      if (!["new", "confirming"].includes(order.status)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot transition from ${order.status} to ${status}.`,
        });
      }

      // Perform the update
      const updated = await tokenCampaignOrdersDB.updateOrderById(orderId, { status });
      if (!updated) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Failed to update order status." });
      }

      return updated;
    }),
});
