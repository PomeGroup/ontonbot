import { getErrorMessages } from "@/lib/error";
import { CronJob } from "cron";
import "dotenv/config";
import { logger } from "@/server/utils/logger";
import "@/lib/gracefullyShutdown";
import cronJobs, { cronJobRunner } from "@/cronJobs";
import { redisTools } from "@/lib/redisTools";
import { is_prod_env, is_stage_env } from "@/server/utils/evnutils";

process.on("unhandledRejection", (err) => {
  const messages = getErrorMessages(err);
  logger.error("UNHANDLED ERROR", messages);
});

const deleteLockKeys = async () => {
  const functionNames = Object.keys(cronJobs).filter(
    (key) => typeof (cronJobs as Record<string, unknown>)[key] === "function"
  );

  for (const fn of functionNames) {
    logger.log("Deleting lock for", fn);
    await redisTools.deleteCache(redisTools.cacheKeys.cronJobLock + fn);
  }
};

async function MainCronJob() {
  logger.log("====> RUNNING Cron jobs on", process.env.ENV);
  // this method will delete all the lock keys on startup to avoid any stale locks

  new CronJob(
    "*/55 * * * * *", // every 55 seconds
    cronJobs.mintNftForUserSpins, // The function to run
    null, // onComplete (not needed)
    true, // start immediately
    null, // timeZone
    null, // context
    false, // runOnInit => false (don't run on app start)
    null, // utcOffset => null
    false, // unrefTimeout => false
    true // waitForCompletion => true
  );
}

MainCronJob().then(() => logger.log("Cron Jobs Started"));
