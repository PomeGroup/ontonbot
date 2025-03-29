ALTER TABLE "event_registrants" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "rewards" ALTER COLUMN "type" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "rewards" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "visitors" ALTER COLUMN "user_id" SET NOT NULL;