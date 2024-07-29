DO $$ BEGIN
 CREATE TYPE "reward_status" AS ENUM('pending_creation', 'created', 'received', 'notified', 'failed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "rewards" ADD COLUMN "try_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "rewards" ADD COLUMN "status" "reward_status" DEFAULT 'created' NOT NULL;

UPDATE "rewards" set "status"='notified' where "status"='created';
