/*
--------------------------------------------------------------
you can run test by following commands:
pnpm cron:test {cronFunctionName} / yarn cron:test {cronFunctionName}
----------------------------------------------------------------
 */
import "dotenv/config";
import { logger } from "@/server/utils/logger";
import { getErrorMessages } from "@/lib/error";
import "@/lib/gracefullyShutdown";
import cronJobs from "@/cronJobs";

async function main() {
  const [, , fnName] = process.argv; // e.g. "createRewards"

  // Helper function to get all function names in cronJobs
  function getAvailableCronFunctions() {
    return Object.keys(cronJobs).filter((key) => typeof (cronJobs as Record<string, unknown>)[key] === "function");
  }

  if (!fnName) {
    logger.error("No cron function name provided. Usage: (pnpm or yarn) cron:test <cronFunctionName>");
    logger.log(`Available cron functions: ${getAvailableCronFunctions().join("\n cron:test ")}`);
    process.exit(1);
  }

  // Ensure the function name exists in cronJobs
  const cronFn = (cronJobs as Record<string, (...args: any[]) => Promise<any>>)[fnName];
  if (typeof cronFn !== "function") {
    logger.error(`Function "${fnName}" not found in cronJobs.`);
    logger.log(`Available cron functions: ${getAvailableCronFunctions().join(", ")}`);
    process.exit(1);
  }

  logger.log(`====> Running cron function: ${fnName}`);

  // Run the cron function
  try {
    // If your cron job needs arguments, you can parse them from `process.argv` as well
    await cronFn();
    logger.log(`====> "${fnName}" completed successfully.`);
  } catch (err) {
    const messages = getErrorMessages(err);
    logger.error(`Error running "${fnName}":`, messages);
    process.exit(1);
  }
}

main();
