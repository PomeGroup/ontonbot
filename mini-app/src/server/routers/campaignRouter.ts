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

      // Run everything in a transaction
      return await db.transaction(async (tx) => {
        // 1) Find an existing *unused* spin row for this user & package.
        //    We'll lock the row with .forUpdate() so no race conditions occur.
        const spinRow = await tokenCampaignUserSpinsDB.getUnusedSpinForUserTx(tx, userId);

        if (!spinRow) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `No unused spin found for userId ${userId} .`,
          });
        }

        // 2) Fetch eligible collections for the given campaignType
        const allCollections = await tokenCampaignNftCollectionsDB.getCollectionsByCampaignType(campaignType);
        const itemsWithWeight = allCollections.map((c) => ({
          ...c,
          weight: c.probabilityWeight,
        }));

        // 3) Pick an item using secure weighted random
        const selectedCollection = secureWeightedRandom(itemsWithWeight);

        // 4) Assign that collection to the spin row
        //    We just update the existing spin record to reflect the chosen NFT collection
        await tokenCampaignUserSpinsDB.updateUserSpinByIdTx(tx, spinRow.id, {
          nftCollectionId: selectedCollection.id,
        });

        // 5) Return the chosen collection
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
        throw new Error(`Order #${orderId} not found.`);
      }

      // Optional: check if order.userId matches current userId
      if (order.userId !== userId) {
        throw new Error("You are not authorized to view this order.");
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
});
