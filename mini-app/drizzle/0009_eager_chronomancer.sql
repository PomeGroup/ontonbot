CREATE TABLE IF NOT EXISTS "moderation_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"moderator_user_id" bigint NOT NULL,
	"event_uuid" varchar(36) NOT NULL,
	"event_owner_id" bigint NOT NULL,
	"action" "moderation_action" NOT NULL,
	"custom_text" varchar(4096),
	"created_at" timestamp (6) DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "user_point" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "moderation_log_moderator_user_id_idx" ON "moderation_log" USING btree ("moderator_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "moderation_log_event_uuid_idx" ON "moderation_log" USING btree ("event_uuid");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "moderation_log_action_idx" ON "moderation_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "moderation_log_event_owner_id_idx" ON "moderation_log" USING btree ("event_owner_id");