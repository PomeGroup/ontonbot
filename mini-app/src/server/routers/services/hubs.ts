import { initDataProtectedProcedure, publicProcedure, router } from "@/server/trpc";
import { tonSocietyClient } from "@/lib/ton-society-api";
import { HubsResponse } from "@/types";
import { TRPCError } from "@trpc/server";
import { logger } from "@/server/utils/logger";
import { organizerTsVerified } from "@/server/db/userFlags.db";

const hardCodedHubz = {
  status: "success",
  hubs: [
    {
      id: "1",
      name: "Global",
    },
    {
      id: "2",
      name: "Europe",
    },
    {
      id: "3",
      name: "India",
    },
    {
      id: "4",
      name: "Korea",
    },
    {
      id: "5",
      name: "SEA",
    },
    {
      id: "6",
      name: "Caucasus",
    },
    {
      id: "7",
      name: "Turkiye",
    },
    {
      id: "8",
      name: "CIS",
    },
    {
      id: "9",
      name: "UAE",
    },
    {
      id: "10",
      name: "UK",
    },
    {
      id: "11",
      name: "Hong Kong",
    },
    {
      id: "12",
      name: "TON Square",
    },
    {
      id: "13",
      name: "Community",
    },
    {
      id: "33",
      name: "Onton",
    },
    {
      id: "34",
      name: "Japan",
    },
    {
      id: "49",
      name: "Balkans",
    },
  ],
};

const nonVerifiedHubz = {
  status: "success",
  hubs: [
    {
      id: "12",
      name: "TON Square",
    },
    {
      id: "33",
      name: "Onton",
    },
  ],
};

export function getNonVerifiedHubzIds() {
  return ["12", "33"];
}

const getHubs = initDataProtectedProcedure.query(async (opts) => {
  if (process.env.NODE_ENV === "local") {
    return hardCodedHubz;
  }

  const isUserTsVerified = await organizerTsVerified(opts.ctx.user.user_id);
  if (!isUserTsVerified) {
    return nonVerifiedHubz;
  }

  try {
    const response = await tonSocietyClient.get<HubsResponse>(`/hubs`, {
      params: {
        _start: 0,
        _end: 100,
      },
    });

    if (response.status === 200 && response.data) {
      const sortedHubs = response.data.data.sort((a, b) => Number(a.id) - Number(b.id));

      const transformedHubs = sortedHubs.map((hub) => ({
        id: hub.id.toString(),
        name: hub.attributes.title,
      }));

      return {
        status: "success",
        hubs: transformedHubs,
      };
    } else {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch data",
      });
    }
  } catch (error) {
    logger.error("hub fetch failed", error);

    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to fetch data",
    });
  }
});

export const hubsRouter = router({
  getHubs,
});
