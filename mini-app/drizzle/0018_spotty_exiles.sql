DROP TABLE "event_details_search_list";--> statement-breakpoint
DROP INDEX IF EXISTS "events_participation_type_idx";--> statement-breakpoint
ALTER TABLE "event_tickets" ALTER COLUMN "event_uuid" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "event_uuid" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "tickets" ALTER COLUMN "event_uuid" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "airdrop_routines" ADD COLUMN "update_counter" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "airdrop_routines" ADD COLUMN "updated_at" timestamp (3);--> statement-breakpoint
ALTER TABLE "airdrop_routines" ADD COLUMN "updated_by" text DEFAULT 'system' NOT NULL;--> statement-breakpoint
ALTER TABLE "event_fields" ADD COLUMN "update_counter" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "event_fields" ADD COLUMN "updated_at" timestamp (3);--> statement-breakpoint
ALTER TABLE "event_fields" ADD COLUMN "updated_by" text DEFAULT 'system' NOT NULL;--> statement-breakpoint
ALTER TABLE "event_tickets" ADD COLUMN "update_counter" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "event_tickets" ADD COLUMN "updated_at" timestamp (3);--> statement-breakpoint
ALTER TABLE "event_tickets" ADD COLUMN "updated_by" text DEFAULT 'system' NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "update_counter" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "updated_at" timestamp (3);--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "updated_by" text DEFAULT 'system' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "update_counter" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "updated_at" timestamp (3);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "updated_by" text DEFAULT 'system' NOT NULL;--> statement-breakpoint
ALTER TABLE "rewards" ADD COLUMN "update_counter" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "rewards" ADD COLUMN "updated_at" timestamp (3);--> statement-breakpoint
ALTER TABLE "rewards" ADD COLUMN "updated_by" text DEFAULT 'system' NOT NULL;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "update_counter" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "updated_at" timestamp (3);--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "updated_by" text DEFAULT 'system' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_event_fields" ADD COLUMN "update_counter" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "user_event_fields" ADD COLUMN "updated_at" timestamp (3);--> statement-breakpoint
ALTER TABLE "user_event_fields" ADD COLUMN "updated_by" text DEFAULT 'system' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "update_counter" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "updated_at" timestamp (3);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "updated_by" text DEFAULT 'system' NOT NULL;--> statement-breakpoint
ALTER TABLE "visitors" ADD COLUMN "update_counter" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "visitors" ADD COLUMN "updated_at" timestamp (3);--> statement-breakpoint
ALTER TABLE "visitors" ADD COLUMN "updated_by" text DEFAULT 'system' NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "airdrop_update_counter_idx" ON "airdrop_routines" USING btree ("update_counter");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "airdrop_updated_at_idx" ON "airdrop_routines" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "eventf_update_counter_idx" ON "event_fields" USING btree ("update_counter");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "eventf_updated_at_idx" ON "event_fields" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "eventt_update_counter_idx" ON "event_tickets" USING btree ("update_counter");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "eventt_updated_at_idx" ON "event_tickets" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "events_updated_at_idx" ON "events" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "events_update_counter_idx" ON "events" USING btree ("update_counter");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_update_counter_idx" ON "orders" USING btree ("update_counter");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_updated_at_idx" ON "orders" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rewards_update_counter_idx" ON "rewards" USING btree ("update_counter");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rewards_updated_at_idx" ON "rewards" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tickets_update_counter_idx" ON "tickets" USING btree ("update_counter");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tickets_updated_at_idx" ON "tickets" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "uef_update_counter_idx" ON "user_event_fields" USING btree ("update_counter");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "uef_updated_at_idx" ON "user_event_fields" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_updated_at_idx" ON "users" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_update_counter_idx" ON "users" USING btree ("update_counter");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "visitors_update_counter_idx" ON "visitors" USING btree ("update_counter");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "visitors_updated_at_idx" ON "visitors" USING btree ("updated_at");--> statement-breakpoint
ALTER TABLE "events" DROP COLUMN IF EXISTS "participation_type";