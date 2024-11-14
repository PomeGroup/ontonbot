import { publicProcedure, router } from "@/server/trpc";
import { fetchOntonSettings } from "@/server/db/ontoSetting";

export const configRouter = router({
  getConfig: publicProcedure.query(async () => {
    console.log("********************NEXT_PUBLIC_BOT_USERNAME", process.env.NEXT_PUBLIC_BOT_USERNAME);
    try {
      const { config } = await fetchOntonSettings();
      return { config };
    } catch (error) {
      console.error("Error fetching config:", error);
      throw new Error("Failed to fetch config");
    }
  }),
});
