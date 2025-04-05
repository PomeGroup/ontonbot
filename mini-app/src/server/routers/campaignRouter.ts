import { router, initDataProtectedProcedure } from "../trpc";
import { z } from "zod";
import { campaignTypes } from "@/db/enum";
import { tokenCampaignNftCollectionsDB } from "@/server/db/tokenCampaignNftCollections.db";
import { tokenCampaignSpinPackagesDB } from "@/server/db/tokenCampaignSpinPackages.db";
import { secureWeightedRandom } from "@/lib/secureWeightedRandom";
import { tokenCampaignUserSpinsDB } from "@/server/db/tokenCampaignUserSpins.db";
import { db } from "@/db/db";
import { tokenCampaignOrdersDB } from "@/server/db/tokenCampaignOrders.db";
import { TokenCampaignOrdersInsert, TokenCampaignOrdersStatus } from "@/db/schema/tokenCampaignOrders";
import { TRPCError } from "@trpc/server";
import userEligibilityDB from "@/server/db/tokenCampaignEligibleUsers.db";
import { affiliateLinksDB } from "@/server/db/affiliateLinks.db";
import { generateRandomHash } from "@/lib/generateRandomHash";
import { Address } from "@ton/core";
import { logger } from "@/server/utils/logger";

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
      return tokenCampaignNftCollectionsDB.getCollectionsByCampaignTypeSecure(campaignType);
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
        if (!selectedCollection) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `CAMPAIGN_LOG:Router: No collection found for campaign type ${campaignType}.`,
          });
        }
        // 4) Assign the chosen collection to the spin row
        await tokenCampaignUserSpinsDB.updateUserSpinByIdTx(tx, spinRow.id, {
          nftCollectionId: selectedCollection.id,
        });
        logger.log(`Assigned collection ${selectedCollection.id} to spin row ${spinRow.id}`);
        // 5) Increment salesCount (and optionally salesVolume) for this collection
        await tokenCampaignNftCollectionsDB.incrementCollectionSalesTx(tx, selectedCollection.id);
        logger.log(`Incremented salesCount for collection ${selectedCollection.id} by 1`);
        // 6) Return the chosen collection
        // convert selectedCollection to secure type
        const selectedCollectionSecure = {
          ...selectedCollection,
          // Add any additional properties you want to secure
          itemsWithWeight: undefined,
          probabilityWeight: undefined,
          createdAt: undefined,
          updatedAt: undefined,
          address: undefined,
        };
        return selectedCollectionSecure;
      });
    }),

  /**
   * 1) Add a new order (must be logged in).
   */
  addOrder: initDataProtectedProcedure
    .input(
      z.object({
        spinPackageId: z.number(),
        // walletAddress: z.string().optional().default(""),
        walletAddress: z.string().refine((data) => Address.isAddress(Address.parse(data))),
        affiliateHash: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Ensure the user is logged in (ctx.user set by your auth)
      const userId = ctx.user?.user_id;

      const { spinPackageId, walletAddress } = input;
      const spinPackage = await tokenCampaignSpinPackagesDB.getSpinPackageById(spinPackageId);
      if (!spinPackage) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `CAMPAIGN_LOG:Router: Spin package with ID ${spinPackageId} not found.`,
        });
      }
      // Check user must not be the affiliator of affiliateHash
      let affiliateHash = null;
      if (input?.affiliateHash) {
        const AffiliateLinkData = await affiliateLinksDB.getAffiliateLinkByHash(input.affiliateHash);
        if (!AffiliateLinkData) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `CAMPAIGN_LOG:Router: Affiliate link with hash ${input.affiliateHash} not found. for userId ${userId}`,
          });
        }
        if (AffiliateLinkData.affiliatorUserId !== userId) {
          affiliateHash = input.affiliateHash;
        }
      }
      // Build the TokenCampaignOrdersInsert object
      // (some columns have defaults in DB, e.g. status="new")
      const orderData: TokenCampaignOrdersInsert = {
        userId,
        spinPackageId,
        finalPrice: spinPackage.price.toString(),
        defaultPrice: spinPackage.price.toString(),
        wallet_address: walletAddress,
        status: "new" as TokenCampaignOrdersStatus,
        currency: spinPackage.currency,
        affiliateHash: affiliateHash ?? null,
      };

      // Insert into the DB
      const order = await tokenCampaignOrdersDB.addOrder(orderData);

      if (!order) {
        logger.error(`CAMPAIGN_LOG:Router: Failed to create order for userId ${userId}:`, orderData, order);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `CAMPAIGN_LOG:Router: Failed to create order.  for userId ${userId}`,
        });
      }
      logger.info(`CAMPAIGN_LOG:Router: Order created for userId ${userId}:`, order);
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

      const { orderId } = input;

      // Fetch from the DB
      const order = await tokenCampaignOrdersDB.getOrderById(orderId);
      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `CAMPAIGN_LOG:Router: Order with ID ${orderId} not found. for userId ${userId}`,
        });
      }

      // Optional: check if order.userId matches current userId
      if (order.userId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `CAMPAIGN_LOG:Router: Order with ID ${orderId} does not belong to the current user. for userId ${userId}`,
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
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `CAMPAIGN_LOG:Router:updateOrderStatusConfirmCancel: Order #${orderId} not found. for userId ${userId}`,
        });
      }

      if (order.userId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `CAMPAIGN_LOG:Router:updateOrderStatusConfirmCancel: You are not the owner of this order. for userId ${userId}`,
        });
      }

      // Only allow switching from "new" or "confirming" to the new status.
      if (!["new", "confirming"].includes(order.status)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `CAMPAIGN_LOG:Router:updateOrderStatusConfirmCancel: Cannot transition from ${order.status} to ${status}. for userId ${userId} and orderId ${orderId}`,
        });
      }

      // Perform the update
      const updated = await tokenCampaignOrdersDB.updateOrderById(orderId, { status });
      if (!updated) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `CAMPAIGN_LOG:Router:updateOrderStatusConfirmCancel: Failed to update order status. for userId ${userId} and orderId ${orderId}`,
        });
      }

      return updated;
    }),
  /**
   *   Check if a user is eligible for a campaign.
   */
  checkUserEligible: initDataProtectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user?.user_id;
    const found = await userEligibilityDB.isUserEligible(userId);
    return { eligible: found };
  }),

  getOnionCampaignAffiliateData: initDataProtectedProcedure.query(async ({ ctx }) => {
    // 1) Check user
    const userId = ctx.user?.user_id;

    // 2) See if there's already a link for onion1-campaign
    let link = await affiliateLinksDB.getAffiliateLinkForOnionCampaign(userId);
    if (!link) {
      // 3) If not, create
      const linkHash = generateRandomHash(8);
      link = await affiliateLinksDB.createOnionCampaignLink(userId, linkHash);
      if (!link) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `CAMPAIGN_LOG:Router:getOnionCampaignAffiliateData: Failed to create affiliate link for userId ${userId}`,
        });
      }
      logger.info(
        `CAMPAIGN_LOG:Router:getOnionCampaignAffiliateData: Created affiliate link for userId ${userId}: ${link.linkHash}`
      );
    }

    // 4) Sum the spin counts from completed orders with this linkHash
    const totalSpins = await tokenCampaignOrdersDB.sumSpinCountByAffiliateHash(link.linkHash);
    const botUserName = process.env.NEXT_PUBLIC_BOT_USERNAME || "theontonbot";
    // 5) Return data
    return {
      linkHash: `https://t.me/${botUserName}/event?startapp=tab_campaign&utm_source=${link.linkHash}`,
      totalSpins,
    };
  }),
});
