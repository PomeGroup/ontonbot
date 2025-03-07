import { MAIN_TG_CHANNEL_ID, MAIN_TG_CHAT_ID } from "@/constants";
import { cacheKeys, cacheLvl, redisTools } from "@/lib/redisTools";
import { default as rewardDB } from "@/server/db/rewards.db";
import { usersDB } from "@/server/db/users";
import rewardService from "@/server/routers/services/rewardsService";
import visitorService from "@/server/routers/services/visitorService";
import { rewardLinkZod } from "@/types/user.types";
import { validateMiniAppData } from "@/utils";
import { tgSafeCall } from "@/utils/tgSafeCall";
import { TRPCError } from "@trpc/server";
import { Bot } from "grammy";
import { z } from "zod";
import { fetchOntonSettings } from "../db/ontoSetting";
import { findVisitorByUserAndEventUuid } from "../db/visitors";
import { adminOrganizerProtectedProcedure, initDataProtectedProcedure, publicProcedure, router } from "../trpc";
import { logger } from "../utils/logger";

export const usersRouter = router({
  validateUserInitData: publicProcedure.input(z.string()).query(async (opts) => {
    return validateMiniAppData(opts.input);
  }),

  haveAccessToEventAdministration: adminOrganizerProtectedProcedure.query(async (opts) => {
    return {
      valid: true,
      role: opts.ctx.userRole,
      user: opts.ctx.user,
    } as const;
  }),

  // private
  syncUser: initDataProtectedProcedure.query(async (opts) => {
    return opts.ctx.user;
  }),

  // private
  getWallet: initDataProtectedProcedure.input(z.object({ wallet_address: z.string().optional() })).query(async (opts) => {
    const res = await usersDB.selectWalletById(opts.ctx.user.user_id);
    // logger.log(res);

    return res?.wallet;
  }),

  // private
  addWallet: initDataProtectedProcedure
    .input(
      z.object({
        wallet: z.string(),
      })
    )
    .mutation(async (opts) => {
      await usersDB.updateWallet(opts.ctx.user.user_id, opts.input.wallet, opts.ctx.user.user_id.toString());
    }),
  createUserReward: initDataProtectedProcedure
    .input(
      z.object({
        event_uuid: z.string().uuid(),
      })
    )
    .mutation(async (opts) => {
      return await rewardService.createUserReward({
        user_id: opts.ctx.user?.user_id as number,
        event_uuid: opts.input.event_uuid,
      });
    }),

  joinOntonTasks: initDataProtectedProcedure.query(async (c) => {
    const { configProtected } = await fetchOntonSettings();
    const checkJoinBotToken = configProtected["check_join_bot_token"] as string;
    const userId = c.ctx.user.user_id;
    const memberStatuses = ["member", "creator", "administrator", "restricted"];

    const tgBot = new Bot(checkJoinBotToken);
    tgBot.stop();

    // main tg channel
    let isJoinedCh = await redisTools.getCache(cacheKeys.join_task_tg_ch + userId);
    if (!isJoinedCh) {
      const { data: chatMember, error: chatError } = await tgSafeCall(() =>
        tgBot.api.getChatMember(MAIN_TG_CHANNEL_ID, userId)
      );

      if (chatError) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: chatError.message,
        });
      }

      const userStatus = chatMember.status;
      isJoinedCh = memberStatuses.includes(userStatus) && (userStatus === "restricted" ? chatMember.is_member : true);
      await redisTools.setCache(cacheKeys.join_task_tg_ch + userId, isJoinedCh, cacheLvl.long);
    }

    // main tg group
    let isJoinedGp = await redisTools.getCache(cacheKeys.join_task_tg_gp + userId);
    if (!isJoinedGp) {
      const { data: chatMemberGp, error: chatErrorGp } = await tgSafeCall(() =>
        tgBot.api.getChatMember(MAIN_TG_CHAT_ID, userId)
      );

      if (chatErrorGp) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: chatErrorGp.message,
        });
      }

      const userStatusGp = chatMemberGp.status;
      isJoinedGp = memberStatuses.includes(userStatusGp) && (userStatusGp === "restricted" ? chatMemberGp.is_member : true);
      await redisTools.setCache(cacheKeys.join_task_tg_gp + userId, isJoinedGp, cacheLvl.long);
    }

    return { ch: isJoinedCh, gp: isJoinedGp, all_done: isJoinedCh && isJoinedGp };
  }),
  getVisitorReward: initDataProtectedProcedure
    .input(
      z.object({
        event_uuid: z.string().uuid(),
      })
    )
    .query(async (opts) => {
      try {
        // logger.log("context we found", opts.ctx);

        await visitorService.addVisitor(opts);
        // Fetch the visitor from the database
        const visitor = await findVisitorByUserAndEventUuid(opts.ctx.user.user_id, opts.input.event_uuid);

        // Check if visitor exists
        if (!visitor) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Visitor not found with the provided user ID and event UUID.",
          });
        }

        try {
          await rewardService.createUserReward({
            user_id: opts.ctx.user?.user_id as number,
            event_uuid: opts.input.event_uuid,
          });
        } catch (error) {
          if (error instanceof TRPCError) {
            logger.log("getVisitorReward_error_createUserReward", error, error.message, opts.ctx.user.user_id);
          }
        }

        // Fetch the reward from the database
        const reward = await rewardDB.findRewardByVisitorId(visitor.id);

        // Check if reward exists
        if (!reward) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "No reward found for the specified visitor.",
          });
        }

        if (reward.status === "pending_creation") {
          return {
            type: "wait_for_reward",
            message: "We successfully collected your data, you'll receive your reward link through a bot message.",
            data: null,
          } as const;
        }

        // validate reward data
        const dataValidation = rewardLinkZod.safeParse(reward.data);
        if (!dataValidation.success) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Reward data is invalid: " + JSON.stringify(reward.data),
          });
        }

        return {
          ...reward,
          data: dataValidation.data.reward_link,
          type: "reward_link_generated",
        } as const;
      } catch (error) {
        logger.error("Error in getVisitorReward query:", error);
        if (error instanceof TRPCError) {
          throw error;
        } else {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "An unexpected error occurred while retrieving visitor reward.",
          });
        }
      }
    }),
});
