import { db } from "@/db/db";
import { callbackTaskRuns, callbackTaskRunStatusEnum, callbackTaskRunStatusType } from "@/db/schema/callbackTaskRuns";
import { and, eq, isNull, lte, or } from "drizzle-orm";
import { CallbackTaskRunsRow } from "@/db/schema/callbackTaskRuns";

const MAX_ATTEMPTS = 3;

/**
 *  Fetch pending callbackTaskRuns that are due to run.
 */
export const fetchPendingCallbackRuns = async (limitValue: number = 10) => {
  const now = new Date();
  return db
    .select()
    .from(callbackTaskRuns)
    .where(
      // (status = 'PENDING') AND (next_run_at <= now)
      and(
        eq(callbackTaskRuns.status, "PENDING"),
        or(lte(callbackTaskRuns.next_run_at, now), isNull(callbackTaskRuns.next_run_at))
      )
    )
    .limit(limitValue);
};

/**
 * Update the status/response of a callbackTaskRun by ID.
 *
 * @param runId - The primary key (id) of the callbackTaskRun
 * @param data - Partial data to update (e.g. status, response, attempts)
 */
export const updateCallbackTaskRun = async (runId: number, data: Partial<CallbackTaskRunsRow>): Promise<void> => {
  await db.update(callbackTaskRuns).set(data).where(eq(callbackTaskRuns.id, runId));
};

/**
 * Determine the updated status given the current attempt count.
 */
export const computeNextStatus = (currentAttempts: number): callbackTaskRunStatusType => {
  const newAttempts = currentAttempts + 1;
  return newAttempts >= MAX_ATTEMPTS
    ? callbackTaskRunStatusEnum.enumValues[2] // 'FAILURE'
    : callbackTaskRunStatusEnum.enumValues[0]; // 'PENDING'
};

const callbackTaskRunsDB = {
  fetchPendingCallbackRuns,
  updateCallbackTaskRun,
  computeNextStatus,
};
export default callbackTaskRunsDB;
