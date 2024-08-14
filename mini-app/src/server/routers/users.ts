import { db } from "@/db/db";
import { rewards, users } from "@/db/schema";
import { createUserRewardLink } from "@/lib/ton-society-api";
import { rewardLinkZod } from "@/types/user.types";
import { validateMiniAppData } from "@/utils";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { selectValidVisitorById } from "../db/visitors";
import { initDataProtectedProcedure, publicProcedure, router } from "../trpc";

export const usersRouter = router({
  validateUserInitData: publicProcedure
    .input(z.string())
    .query(async (opts) => {
      const data = validateMiniAppData(opts.input);
      return data;
    }),

  haveAccessToEventAdministration: publicProcedure
    .input(z.string())
    .query(async (opts) => {
      if (!opts.input) {
        return undefined;
      }

      try {
        const data = validateMiniAppData(opts.input);

        if (!data.valid) {
          return { valid: false } as const;
        }

        const userRole = await db
          .select({ role: users.role })
          .from(users)
          .where(eq(users.user_id, data.initDataJson.user.id))
          .execute();

        if (
          !userRole ||
          (userRole[0].role !== "admin" && userRole[0].role !== "organizer")
        ) {
          return { valid: false } as const;
        }

        return {
          valid: true,
          role: userRole[0].role,
          user: data.initDataJson.user,
        } as const;
      } catch (error) {
        console.error(error);
      }
      return { valid: false } as const;
    }),

  // private
  addUser: publicProcedure
    .input(z.object({ initData: z.string() }))
    .mutation(async (opts) => {
      if (!opts.input.initData) {
        throw new TRPCError({
          message: "initdata is required",
          code: "BAD_REQUEST",
        });
      }

      const { valid, initDataJson } = validateMiniAppData(opts.input.initData);

      if (!valid) {
        throw new TRPCError({
          message: "invalid initdata",
          code: "UNPROCESSABLE_CONTENT",
        });
      }

      const data = await db
        .insert(users)
        .values({
          user_id: initDataJson.user.id,
          username: initDataJson.user.username,
          first_name: initDataJson.user.first_name,
          last_name: initDataJson.user.last_name,
          language_code: initDataJson.user.language_code,
          role: "user",
        })
        .onConflictDoNothing()
        .execute();

      if (!data.length) {
        throw new TRPCError({
          message: "user already exists",
          code: "CONFLICT",
        });
      }

      return data;
    }),

  // private
  getWallet: publicProcedure
    .input(z.object({ initData: z.string().optional() }))
    .query(async (opts) => {
      if (!opts.input.initData) {
        return;
      }

      const { valid, initDataJson } = validateMiniAppData(opts.input.initData);

      if (!valid) {
        return;
      }

      const res = await db
        .select({ wallet: users.wallet_address })
        .from(users)
        .where(eq(users.user_id, initDataJson.user.id))
        .execute();

      return res[0]?.wallet;
    }),

  // private
  addWallet: publicProcedure
    .input(
      z.object({
        initData: z.string().optional(),
        wallet: z.string(),
      })
    )
    .mutation(async (opts) => {
      if (!opts.input.initData) {
        return;
      }

      const { valid, initDataJson } = validateMiniAppData(opts.input.initData);

      if (!valid) {
        return;
      }

      db.update(users)
        .set({
          wallet_address: opts.input.wallet,
        })
        .where(eq(users.user_id, initDataJson.user.id))
        .execute();
    }),

  // private
  deleteWallet: publicProcedure
    .input(
      z.object({
        initData: z.string().optional(),
      })
    )
    .mutation(async (opts) => {
      if (!opts.input.initData) {
        return;
      }

      const { valid, initDataJson } = validateMiniAppData(opts.input.initData);

      if (!valid) {
        return;
      }

      db.update(users)
        .set({
          wallet_address: null,
        })
        .where(eq(users.user_id, initDataJson.user.id))
        .execute();
    }),

  createUserReward: initDataProtectedProcedure
    .input(
      z.object({
        event_uuid: z.string().uuid(),
      })
    )
    .mutation(async (opts) => {
      return await createUserReward({
        wallet_address: opts.ctx.user?.wallet_address as string,
        user_id: opts.ctx.user?.user_id as number,
        event_uuid: opts.input.event_uuid,
      });
    }),

  getVisitorReward: initDataProtectedProcedure
    .input(
      z.object({
        event_uuid: z.string().uuid(),
      })
    )
    .query(async (opts) => {
      try {
        // Fetch the visitor from the database
        const visitor = await db.query.visitors.findFirst({
          where(fields, { eq, and }) {
            return and(
              eq(fields.user_id, opts.ctx.parsedInitData.user.id),
              eq(fields.event_uuid, opts.input.event_uuid)
            );
          },
        });

        // Check if visitor exists
        if (!visitor) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "Visitor not found with the provided user ID and event UUID.",
          });
        }

        try {
          await createUserReward({
            wallet_address: opts.ctx.user?.wallet_address as string,
            user_id: opts.ctx.user?.user_id as number,
            event_uuid: opts.input.event_uuid,
          });
        } catch (error) {
          if (error instanceof TRPCError) {
            if (error.code === "CONFLICT") {
              await db
                .insert(rewards)
                .values({
                  status: "pending_creation",
                  type: "ton_society_sbt",
                  visitor_id: visitor.id,
                })
                .execute();
              return {
                type: "wait_for_reward",
                message:
                  "We successfully collected your data, you'll receive your reward link through a bot message.",
                data: null,
              } as const;
            }
          } else {
            console.log(error);
          }
        }

        // Fetch the reward from the database
        const reward = await db.query.rewards.findFirst({
          where(fields, { eq }) {
            return eq(fields.visitor_id, visitor.id);
          },
        });

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
            message:
              "We successfully collected your data, you'll receive your reward link through a bot message.",
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
        console.error("Error in getVisitorReward query:", error);
        if (error instanceof TRPCError) {
          throw error;
        } else {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              "An unexpected error occurred while retrieving visitor reward.",
          });
        }
      }
    }),
});

async function createUserReward(props: {
  wallet_address: string;
  user_id: number;
  event_uuid: string;
}) {
  try {
    // Fetch the visitor from the database
    const visitor = await db.query.visitors.findFirst({
      where(fields, { eq, and }) {
        return and(
          eq(fields.user_id, props.user_id),
          eq(fields.event_uuid, props.event_uuid)
        );
      },
    });

    // Check if visitor exists
    if (!visitor) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Visitor not found with the provided user ID and event UUID.",
      });
    }

    // Validate the visitor
    const isValidVisitor = await selectValidVisitorById(visitor.id);
    if (!isValidVisitor.length) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Invalid visitor: please complete the tasks.",
      });
    }

    // check if the user already does not own the reward
    const reward = await db.query.rewards.findFirst({
      where(fields, { eq, and }) {
        return and(eq(fields.visitor_id, visitor.id));
      },
    });

    if (reward) {
      const err_msg = `user with id ${visitor.id} already recived reward by id ${reward.id} for event ${props.event_uuid}`;
      console.log(err_msg);
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: err_msg,
      });
    }

    const eventData = await db.query.events.findFirst({
      where(fields, { eq }) {
        return eq(fields.event_uuid, props.event_uuid);
      },
    });

    if (!eventData?.activity_id || eventData.activity_id < 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `this event does not have an activity id ${eventData?.activity_id}`,
      });
    }

    const startDate = Number(eventData.start_date) * 1000;
    const endDate = Number(eventData.end_date) * 1000;

    if (Date.now() < startDate || Date.now() > endDate) {
      throw new TRPCError({
        message: "Eather event is not started or ended",
        code: "FORBIDDEN",
      });
    }

    try {
      // Create the user reward link
      const res = await createUserRewardLink(eventData.activity_id, {
        telegram_user_id: props.user_id,
        attributes: eventData.society_hub
          ? [
              {
                trait_type: "Organizer",
                value: eventData.society_hub,
              },
            ]
          : undefined,
      });

      // Ensure the response contains data
      if (!res || !res.data || !res.data.data) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Failed to create user reward link.",
        });
      }

      // Insert the reward into the database
      await db
        .insert(rewards)
        .values({
          visitor_id: visitor.id,
          type: "ton_society_sbt",
          data: res.data.data,
        })
        .execute();

      return res.data.data;
    } catch (error) {
      console.error("error ehile creating reward link", error);
      if (error instanceof TRPCError) {
        throw error;
      }
      // Ensure the response contains data
      throw new TRPCError({
        code: "CONFLICT",
        message: "Failed to create user reward link.",
        cause: error,
      });
    }
  } catch (error) {
    console.error("Error in createUserReward mutation:", error);
    if (error instanceof TRPCError) {
      throw error;
    } else {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred while creating user reward.",
      });
    }
  }
}
