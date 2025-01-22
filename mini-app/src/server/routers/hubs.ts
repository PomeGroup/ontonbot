import { initDataProtectedProcedure, router } from "@/server/trpc";
import { hardCodedHubs, nonVerifiedHubs } from "@/constants";
import { getHubs as getHubsApi} from "@/lib/ton-society-api";
import { organizerTsVerified } from "@/server/db/userFlags.db";

const getHubs = initDataProtectedProcedure.query(async () => {
  console.log("getHubs");
    return await getHubsApi();
});

const getOrgHubs = initDataProtectedProcedure.query(async (opts) => {
  // return hard coded hubs for local env
  if (process.env?.ENV === "local") {
    return hardCodedHubs;
  }

  const isUserTsVerified = await organizerTsVerified(opts.ctx.user.user_id);
  // return non verified hubs
  if (!isUserTsVerified) {
    return nonVerifiedHubs;
  }
  // return all hubs
  return await getHubsApi();
});

export const hubsRouter = router({
  getHubs,
  getOrgHubs,
});
