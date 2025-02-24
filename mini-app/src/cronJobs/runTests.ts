/*
--------------------------------------------------------------
You can run this script by commands:
pnpm cron:test <cronFunctionName>
yarn cron:test <cronFunctionName>
node run-cron.js <cronFunctionName>
--------------------------------------------------------------
*/
import "dotenv/config";
import { logger } from "@/server/utils/logger";
import { getErrorMessages } from "@/lib/error";
import "@/lib/gracefullyShutdown";
import cronJobs from "@/cronJobs";

import readline from "readline";

async function main() {
  const [, , fnName] = process.argv; // e.g. "createRewards"

  // Helper function to get all function names in cronJobs
  function getAvailableCronFunctions() {
    return Object.keys(cronJobs).filter((key) => typeof (cronJobs as Record<string, unknown>)[key] === "function");
  }

  if (!fnName) {
    logger.error("No cron function name provided. Usage: (pnpm or yarn) cron:test <cronFunctionName>");
    logger.log(`Available cron functions:\n  ${getAvailableCronFunctions().join("\n  cron:test ")}`);
    process.exit(1);
  }

  // Ensure the function name exists in cronJobs
  const cronFn = (cronJobs as Record<string, (...args: any[]) => Promise<any>>)[fnName];
  if (typeof cronFn !== "function") {
    logger.error(`Function "${fnName}" not found in cronJobs.`);
    logger.log(`Available cron functions: ${getAvailableCronFunctions().join(", ")}`);
    process.exit(1);
  }

  // Prompt user for confirmation
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question(`You are about to run the cron function "${fnName}" manually. Are you sure? (y/n): `, async (answer) => {
    rl.close();
    const normalized = answer.trim().toLowerCase();

    if (normalized !== "y" && normalized !== "yes") {
      logger.warn(`Aborting. Cron function "${fnName}" was not run.`);
      process.exit(0);
    }

    // If user confirmed, proceed
    logger.log(`====> Running cron function: ${fnName}`);
    try {
      await cronFn();
      logger.log(`====> "${fnName}" completed successfully.`);
      process.exit(0);
    } catch (err) {
      const messages = getErrorMessages(err);
      logger.error(`Error running "${fnName}":`, messages);
      process.exit(1);
    }
  });
}

main();
