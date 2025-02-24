import { getErrorMessages } from "@/lib/error";
import { CronJob } from "cron";
import "dotenv/config";
import { logger } from "@/server/utils/logger";
import "@/lib/gracefullyShutdown";
import cronJobs, { cronJobRunner } from "@/cronJobs";

process.on("unhandledRejection", (err) => {
  const messages = getErrorMessages(err);
  logger.error("UNHANDLED ERROR", messages);
});

async function MainCronJob() {
  logger.log("====> RUNNING Cron jobs on", process.env.ENV);

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
}

MainCronJob().then(() => logger.log("Cron Jobs Started"));
