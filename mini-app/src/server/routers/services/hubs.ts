import { publicProcedure, router } from "@/server/trpc";
import { tonSocietyClient } from "@/lib/ton-society-api";
import { HubsResponse } from "@/types";
import { TRPCError } from "@trpc/server";
import { logger } from "@/server/utils/logger";

const getHubs = publicProcedure.query(async () => {
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