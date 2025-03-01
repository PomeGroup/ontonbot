ALTER TABLE "callback_tasks" ALTER COLUMN "retry_policy" SET DEFAULT '{"max_attempt":5,"wait_for_retry":1000}'::json;--> statement-breakpoint
ALTER TABLE "callback_task_runs" ADD COLUMN "next_run_at" timestamp (3);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "callback_task_runs_next_run_at_idx" ON "callback_task_runs" USING btree ("next_run_at");