ALTER TABLE "users" ADD COLUMN "is_premium" boolean;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "allows_write_to_pm" boolean;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "photo_url" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "participated_event_count" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "hosted_event_count" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "has_blocked_the_bot" boolean;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "org_channel_name" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "org_support_telegram_user_name" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "org_x_link" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "org_bio" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "org_image" varchar(255);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_is_premium_idx" ON "users" USING btree ("is_premium");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_hosted_event_count_idx" ON "users" USING btree ("hosted_event_count");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_org_channel_name_idx" ON "users" USING btree ("org_channel_name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_id" ON "users" USING btree ("user_id");