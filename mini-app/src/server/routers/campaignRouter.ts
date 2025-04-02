import { router, initDataProtectedProcedure } from "../trpc";
import { z } from "zod";
import { campaignTypes, paymentTypes } from "@/db/enum";
import { tokenCampaignNftCollectionsDB } from "@/server/db/tokenCampaignNftCollections.db";
import { tokenCampaignSpinPackagesDB } from "@/server/db/tokenCampaignSpinPackages.db";
import { secureWeightedRandom } from "@/lib/secureWeightedRandom";
import { tokenCampaignUserSpinsDB } from "@/server/db/tokenCampaignUserSpins.db";
import { db } from "@/db/db";
import { tokenCampaignOrdersDB } from "@/server/db/tokenCampaignOrders.db";
import { TokenCampaignOrdersStatus } from "@/db/schema/tokenCampaignOrders";

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
        spinPackageId: z.number().int().positive(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { campaignType, spinPackageId } = input;
      const userId = ctx.user?.user_id;
      if (!userId) {
        throw new Error("User not logged in or missing user ID.");
      }

      // Run everything in a transaction
      return await db.transaction(async (tx) => {
        // 1) Find an existing *unused* spin row for this user & package.
        //    We'll lock the row with .forUpdate() so no race conditions occur.
        const spinRow = await tokenCampaignUserSpinsDB.getUnusedSpinForUserTx(tx, userId, spinPackageId);

        if (!spinRow) {
          throw new Error("No remaining spins for this user in this package.");
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
        finalPrice: z.number(),
        defaultPrice: z.number(),
        walletAddress: z.string().optional().default(""),
        // Ensure the currency input matches your allowed payment types (ton, etc.)
        currency: z.enum(paymentTypes.enumValues),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Ensure the user is logged in (ctx.user set by your auth)
      const userId = ctx.user?.user_id;
      if (!userId) {
        throw new Error("User not logged in or missing user ID.");
      }

      const { spinPackageId, finalPrice, defaultPrice, walletAddress, currency } = input;

      // Build the TokenCampaignOrdersInsert object
      // (some columns have defaults in DB, e.g. status="new")
      const orderData = {
        userId,
        spinPackageId,
        finalPrice: finalPrice.toString(),
        defaultPrice: defaultPrice.toString(),
        wallet_address: walletAddress,
        status: "new" as TokenCampaignOrdersStatus,
        currency,
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
});
