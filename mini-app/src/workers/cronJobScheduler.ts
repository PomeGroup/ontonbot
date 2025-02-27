import { getErrorMessages } from "@/lib/error";
import { CronJob } from "cron";
import "dotenv/config";
import { logger } from "@/server/utils/logger";
import "@/lib/gracefullyShutdown";
import cronJobs, { cronJobRunner } from "@/cronJobs";
import { redisTools } from "@/lib/redisTools";

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
  await deleteLockKeys();
  new CronJob("*/1 * * * *", cronJobRunner(cronJobs.CreateRewards), null, true);
  new CronJob("*/3 * * * *", cronJobRunner(cronJobs.notifyUsersForRewards), null, true);
  new CronJob("0 */4 * * *", cronJobs.sendPaymentReminder, null, true);
  new CronJob("*/7 * * * * *", cronJobs.CheckTransactions, null, true);
  new CronJob("*/24 * * * * *", cronJobRunner(cronJobs.UpdateEventCapacity), null, true);
  new CronJob("*/19 * * * * *", cronJobRunner(cronJobs.CreateEventOrders), null, true);
  new CronJob("*/9 * * * * *", cronJobRunner(cronJobs.MintNFTForPaidOrders), null, true);
  new CronJob("*/11 * * * * *", cronJobRunner(cronJobs.TsCsbtTicketOrder), null, true);
  new CronJob("*/21 * * * * *", cronJobs.OrganizerPromoteProcessing, null, true);
  new CronJob("0 */30 * * * *", cronJobs.syncSbtCollectionsForEvents, null, true);
  // run every Tuesday at 1:00 AM
  new CronJob("0 1 * * 2", cronJobs.CheckAllUsersBlock, null, true);
}

MainCronJob().then(() => logger.log("Cron Jobs Started"));
